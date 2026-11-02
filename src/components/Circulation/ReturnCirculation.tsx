import React, { useState } from 'react';
import {
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Search,
  Filter,
  DollarSign,
  Calendar,
  FileText,
  RefreshCw
} from 'lucide-react';
import { LoanTransaction, BookCondition, LibrarySettings, Book } from '../../types/library';
import {
  formatRupiah,
  formatDateIndo,
  getTodayDateString,
  calculateDaysOverdue
} from '../../utils/formatters';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../../utils/datePeriods';
import { PeriodFilterBar } from '../Common/PeriodFilterBar';
import { HighlightMatch } from '../Common/HighlightMatch';

interface ReturnCirculationProps {
  loans: LoanTransaction[];
  books: Book[];
  settings: LibrarySettings;
  onProcessReturn: (
    loanId: string,
    returnDate: string,
    condition: BookCondition,
    isLost: boolean,
    fineAmount: number,
    finePaid: boolean,
    notes: string
  ) => void;
  onPrintReceipt: (loan: LoanTransaction) => void;
  onNavigateToCycles?: () => void;
}

export const ReturnCirculation: React.FC<ReturnCirculationProps> = ({
  loans,
  books,
  settings,
  onProcessReturn,
  onPrintReceipt,
  onNavigateToCycles,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'NORMAL'>('ALL');

  // Modal State
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<LoanTransaction | null>(null);
  const [returnDate, setReturnDate] = useState(getTodayDateString());
  const [returnCondition, setReturnCondition] = useState<BookCondition>('Baik');
  const [isBookLost, setIsBookLost] = useState(false);
  const [finePaid, setFinePaid] = useState(true);
  const [returnNotes, setReturnNotes] = useState('');
  const [customFineAdjustment, setCustomFineAdjustment] = useState(0);

  // Filter Active vs Returned
  const pendingLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const returnedLoans = loans.filter((l) => l.status === 'Kembali' || l.status === 'Hilang');

  // Returned loans filtered by period
  const returnedInPeriod = returnedLoans.filter((l) => isDateInPeriod(l.returnDate, selectedPeriod));
  const finesCollectedInPeriod = returnedInPeriod
    .filter((l) => l.finePaid)
    .reduce((acc, l) => acc + l.fineAmount, 0);
  const finesUnpaidInPeriod = returnedInPeriod
    .filter((l) => !l.finePaid)
    .reduce((acc, l) => acc + l.fineAmount, 0);
  const damagedOrLostCount = returnedInPeriod.filter(
    (l) => l.status === 'Hilang' || l.returnCondition === 'Rusak Berat'
  ).length;

  // Recalculate dynamic overdue status for pending loans
  const pendingLoansWithDynamicOverdue = pendingLoans.map((loan) => {
    const overdueDays = calculateDaysOverdue(loan.dueDate);
    const calculatedFine = overdueDays * settings.finePerDay;
    return {
      ...loan,
      overdueDays,
      fineAmount: calculatedFine,
      isOverdue: overdueDays > 0,
    };
  });

  // Filter pending loans
  const filteredPending = pendingLoansWithDynamicOverdue.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      l.memberName.toLowerCase().includes(q) ||
      l.bookTitle.toLowerCase().includes(q) ||
      l.transactionCode.toLowerCase().includes(q) ||
      l.bookCallNumber.toLowerCase().includes(q);

    if (statusFilter === 'OVERDUE') return matchQuery && l.isOverdue;
    if (statusFilter === 'NORMAL') return matchQuery && !l.isOverdue;
    return matchQuery;
  });

  // Filter history
  const filteredHistory = returnedLoans.filter((l) => {
    const q = searchQuery.toLowerCase();
    const inPeriod = isDateInPeriod(l.returnDate, selectedPeriod);
    const matchesQuery =
      l.memberName.toLowerCase().includes(q) ||
      l.bookTitle.toLowerCase().includes(q) ||
      l.transactionCode.toLowerCase().includes(q) ||
      l.bookCallNumber.toLowerCase().includes(q);
    return inPeriod && matchesQuery;
  });

  // Open return modal
  const handleOpenReturnModal = (loan: LoanTransaction & { overdueDays: number; fineAmount: number }) => {
    setSelectedLoanForReturn(loan);
    setReturnDate(getTodayDateString());
    setReturnCondition('Baik');
    setIsBookLost(false);
    setFinePaid(true);
    setReturnNotes('');
    setCustomFineAdjustment(0);
  };

  // Associated book for price estimation if damaged/lost
  const currentBook = selectedLoanForReturn
    ? books.find((b) => b.id === selectedLoanForReturn.bookId)
    : null;

  // Calculate total fines for the modal
  const dynamicOverdueDays = selectedLoanForReturn
    ? calculateDaysOverdue(selectedLoanForReturn.dueDate, returnDate)
    : 0;

  const lateFine = dynamicOverdueDays * settings.finePerDay;
  const lostFine = isBookLost && currentBook ? currentBook.price : 0;
  const damageFine =
    returnCondition === 'Rusak Berat' && currentBook ? Math.round(currentBook.price * 0.5) : 0;

  const totalCalculatedFine = lateFine + lostFine + damageFine + customFineAdjustment;

  // Submit return
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForReturn) return;

    onProcessReturn(
      selectedLoanForReturn.id,
      returnDate,
      returnCondition,
      isBookLost,
      totalCalculatedFine,
      finePaid,
      returnNotes
    );

    const updatedLoanObj: LoanTransaction = {
      ...selectedLoanForReturn,
      returnDate,
      status: isBookLost ? 'Hilang' : 'Kembali',
      overdueDays: dynamicOverdueDays,
      fineAmount: totalCalculatedFine,
      finePaid,
      returnCondition,
      notes: returnNotes,
    };

    setSelectedLoanForReturn(null);

    // Offer to print receipt if there was a fine or on request
    if (totalCalculatedFine > 0) {
      if (confirm('Buku berhasil dikembalikan! Apakah ingin mencetak Kuitansi Pengembalian & Denda?')) {
        onPrintReceipt(updatedLoanObj);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              Sirkulasi Pengembalian & Denda
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {pendingLoans.length} Buku Dipinjam
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengecekan fisik buku, hitung hari keterlambatan, dan pelunasan denda otomatis ({formatRupiah(settings.finePerDay)}/hari)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onNavigateToCycles && (
            <button
              onClick={onNavigateToCycles}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span>Siklus Peminjaman Buku</span>
            </button>
          )}

          {/* Tab switch: Aktif vs Riwayat */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white shadow text-slate-900 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              Harus Kembali ({pendingLoans.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white shadow text-slate-900 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              Riwayat Selesai ({returnedLoans.length})
            </button>
          </div>
        </div>
      </div>

      {/* Universal Period Filter Bar */}
      <PeriodFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={(p) => setSelectedPeriod(p)}
        title="Rekapitulasi Pengembalian & Denda:"
        summaryText={`${returnedInPeriod.length} Selesai • Denda: ${formatRupiah(finesCollectedInPeriod)}`}
      />

      {/* Rekapitulasi Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Pengembalian Periode
          </span>
          <div className="text-2xl font-extrabold text-blue-700">
            {returnedInPeriod.length} <span className="text-xs font-normal text-slate-500">Buku</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {getPeriodLabel(selectedPeriod)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Kas Denda Terkumpul (Lunas)
          </span>
          <div className="text-2xl font-extrabold text-emerald-700">
            {formatRupiah(finesCollectedInPeriod)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
            Lunas dibayar peminjam
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Denda Belum Lunas
          </span>
          <div className="text-2xl font-extrabold text-rose-600">
            {formatRupiah(finesUnpaidInPeriod)}
          </div>
          <span className="text-[10px] text-rose-500 font-medium mt-1 block">
            Tertunggak periode ini
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Buku Rusak / Hilang
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {damagedOrLostCount} <span className="text-xs font-normal text-slate-500">Kasus</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Telah ditindaklanjuti
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama peminjam, kode transaksi, judul buku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
            >
              ×
            </button>
          )}
        </div>

        {activeTab === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hanya Terlambat</span>
            </button>
            <button
              onClick={() => setStatusFilter('NORMAL')}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                statusFilter === 'NORMAL'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Aman
            </button>
          </div>
        )}
      </div>

      {/* Main Table: Pending Returns */}
      {activeTab === 'pending' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-3">Judul Buku</th>
                  <th className="py-3 px-3">Tgl Pinjam / Batas Tempo</th>
                  <th className="py-3 px-3">Status & Keterlambatan</th>
                  <th className="py-3 px-3">Estimasi Denda</th>
                  <th className="py-3 px-4 text-right">Proses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPending.length > 0 ? (
                  filteredPending.map((loan) => (
                    <tr
                      key={loan.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        loan.isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          <HighlightMatch text={loan.memberName} query={searchQuery} />
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {loan.memberRole} • {loan.memberClass}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          <HighlightMatch text={loan.transactionCode} query={searchQuery} />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 max-w-sm">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          <HighlightMatch text={loan.bookTitle} query={searchQuery} />
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {loan.bookCallNumber} • Kode: {loan.bookCode}
                        </div>
                        {loan.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            Catatan: {loan.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-500 text-[11px]">
                          Pinjam: {formatDateIndo(loan.borrowDate)}
                        </div>
                        <div className="font-semibold text-slate-800">
                          Tempo: {formatDateIndo(loan.dueDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {loan.isOverdue ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Terlambat {loan.overdueDays} Hari</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Masa Peminjaman Aman</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {loan.isOverdue ? (
                          <div className="font-bold text-rose-700 text-sm">
                            {formatRupiah(loan.fineAmount)}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">Rp 0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReturnModal(loan)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Kembalikan</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada data peminjaman yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TABLE: Returned History */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kode Transaksi</th>
                  <th className="py-3 px-3">Peminjam</th>
                  <th className="py-3 px-3">Judul Buku</th>
                  <th className="py-3 px-3">Tgl Kembali</th>
                  <th className="py-3 px-3">Kondisi / Denda</th>
                  <th className="py-3 px-4 text-right">Kuitansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {loan.transactionCode}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">
                          <HighlightMatch text={loan.memberName} query={searchQuery} />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {loan.memberRole} • {loan.memberClass}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 max-w-sm">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          <HighlightMatch text={loan.bookTitle} query={searchQuery} />
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {loan.bookCallNumber}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-emerald-800">
                          {formatDateIndo(loan.returnDate)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Jatuh Tempo: {formatDateIndo(loan.dueDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Fisik: {loan.returnCondition || 'Baik'}
                          </span>
                          {loan.fineAmount > 0 ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                loan.finePaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Denda {formatRupiah(loan.fineAmount)} ({loan.finePaid ? 'Lunas' : 'Tertunggak'})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Tanpa Denda</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onPrintReceipt(loan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
                          title="Cetak Kuitansi Bukti Pengembalian & Denda"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Kuitansi</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Belum ada riwayat pengembalian buku.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PROSES PENGEMBALIAN & DENDA */}
      {selectedLoanForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Konfirmasi Pengembalian Buku
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periksa kondisi buku dan hitung kewajiban denda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLoanForReturn(null)}
                className="text-slate-400 hover:text-slate-600 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleConfirmReturn} className="p-6 space-y-4 text-xs">
              {/* Summary Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  {selectedLoanForReturn.bookTitle}
                </div>
                <div className="text-slate-600">
                  Peminjam:{' '}
                  <b className="text-slate-800">
                    {selectedLoanForReturn.memberName} ({selectedLoanForReturn.memberClass})
                  </b>
                </div>
                <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200">
                  <span>Jatuh Tempo: {formatDateIndo(selectedLoanForReturn.dueDate)}</span>
                  <span className="font-mono text-slate-700">{selectedLoanForReturn.transactionCode}</span>
                </div>
              </div>

              {/* Tanggal Pengembalian */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pengembalian
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kondisi Fisik Saat Kembali
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as BookCondition)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none"
                  >
                    <option value="Baik">Baik (Mulus / Wajar)</option>
                    <option value="Rusak Ringan">Rusak Ringan (Robek sedikit)</option>
                    <option value="Rusak Berat">Rusak Berat (Basah / Cacat)</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Buku Hilang */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Status Buku Hilang?</span>
                  <span className="text-[11px] text-amber-700">
                    Buku tidak dapat dikembalikan / hilang oleh siswa
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isBookLost}
                  onChange={(e) => setIsBookLost(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-amber-300 focus:ring-emerald-500"
                />
              </div>

              {/* Rincian Denda Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Rincian Denda & Penggantian
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">
                    Keterlambatan ({dynamicOverdueDays} hari × {formatRupiah(settings.finePerDay)}):
                  </span>
                  <span className="font-mono font-semibold">
                    {formatRupiah(lateFine)}
                  </span>
                </div>

                {isBookLost && (
                  <div className="flex justify-between items-center text-xs text-amber-300">
                    <span>Ganti Rugi Buku Hilang (100% Harga):</span>
                    <span className="font-mono font-semibold">{formatRupiah(lostFine)}</span>
                  </div>
                )}

                {returnCondition === 'Rusak Berat' && !isBookLost && (
                  <div className="flex justify-between items-center text-xs text-amber-300">
                    <span>Biaya Kerusakan Berat (50% Harga):</span>
                    <span className="font-mono font-semibold">{formatRupiah(damageFine)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                  <span>TOTAL WAJIB BAYAR:</span>
                  <span className="text-base">{formatRupiah(totalCalculatedFine)}</span>
                </div>
              </div>

              {/* Status Pelunasan Denda */}
              {totalCalculatedFine > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block">Status Pembayaran Denda</span>
                    <span className="text-[11px] text-slate-500">
                      Tandai jika siswa langsung melunasi di tempat
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={finePaid}
                      onChange={(e) => setFinePaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-emerald-700">Lunas</span>
                  </label>
                </div>
              )}

              {/* Catatan Petugas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pengembalian (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan tambahan petugas perpustakaan..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForReturn(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm shadow-emerald-600/30 transition-all"
                >
                  Selesaikan Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
