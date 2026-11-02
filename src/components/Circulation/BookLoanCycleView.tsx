import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BookOpen,
  User,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Printer,
  History,
  RotateCcw,
  Sparkles,
  Info,
  X,
  FileText
} from 'lucide-react';
import { LoanTransaction, Book, Member, LibrarySettings, LoanCycleEvent } from '../../types/library';
import { formatDateIndo, formatRupiah, getTodayDateString } from '../../utils/formatters';
import { adjustIfFriday } from '../../utils/historyGenerator';
import { HighlightMatch } from '../Common/HighlightMatch';

interface BookLoanCycleViewProps {
  loans: LoanTransaction[];
  books: Book[];
  members: Member[];
  settings: LibrarySettings;
  onUpdateLoan: (updatedLoan: LoanTransaction) => void;
  onNavigateToBorrow?: () => void;
  onNavigateToReturn?: (loanId?: string) => void;
  onPrintSlip?: (loan: LoanTransaction) => void;
  onSyncHistory?: () => void;
}

export const BookLoanCycleView: React.FC<BookLoanCycleViewProps> = ({
  loans,
  books,
  members,
  settings,
  onUpdateLoan,
  onNavigateToBorrow,
  onNavigateToReturn,
  onPrintSlip,
  onSyncHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RENEWED' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '2026-01' ... '2026-11'
  const [selectedLoanForTimeline, setSelectedLoanForTimeline] = useState<LoanTransaction | null>(null);
  const [renewingLoan, setRenewingLoan] = useState<LoanTransaction | null>(null);
  const [renewalNote, setRenewalNote] = useState('');
  const [officerName, setOfficerName] = useState('Siti Rahmawati, S.I.Pust.');

  // Months in 2026
  const months2026 = [
    { key: 'ALL', label: 'Semua (Jan - 2 Nov 2026)' },
    { key: '2026-11', label: 'November 2026 (Hari Ini)' },
    { key: '2026-10', label: 'Oktober 2026' },
    { key: '2026-09', label: 'September 2026' },
    { key: '2026-08', label: 'Agustus 2026' },
    { key: '2026-07', label: 'Juli 2026' },
    { key: '2026-06', label: 'Juni 2026' },
    { key: '2026-05', label: 'Mei 2026' },
    { key: '2026-04', label: 'April 2026' },
    { key: '2026-03', label: 'Maret 2026' },
    { key: '2026-02', label: 'Februari 2026' },
    { key: '2026-01', label: 'Januari 2026' },
  ];

  // Helper to add days skipping Friday
  const addDaysSkippingFriday = (dateStr: string, daysToAdd: number): string => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + daysToAdd);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return adjustIfFriday(`${yr}-${mo}-${dy}`);
  };

  // Filtered Loans based on search, status filter, and 2026 month
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // 1. Month filter
      if (selectedMonth !== 'ALL') {
        if (!loan.borrowDate.startsWith(selectedMonth)) return false;
      }

      // 2. Status filter
      if (statusFilter === 'ACTIVE') {
        if (loan.status !== 'Dipinjam' && loan.status !== 'Terlambat') return false;
      } else if (statusFilter === 'RENEWED') {
        if (!loan.renewalCount || loan.renewalCount === 0) return false;
      } else if (statusFilter === 'OVERDUE') {
        if (loan.status !== 'Terlambat' && loan.overdueDays <= 0) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (loan.status !== 'Kembali') return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = loan.bookTitle.toLowerCase().includes(q);
        const matchMember = loan.memberName.toLowerCase().includes(q);
        const matchCode = loan.transactionCode.toLowerCase().includes(q);
        const matchBookCode = loan.bookCode.toLowerCase().includes(q);
        const matchCallNo = loan.bookCallNumber.toLowerCase().includes(q);
        if (!matchTitle && !matchMember && !matchCode && !matchBookCode && !matchCallNo) {
          return false;
        }
      }

      return true;
    });
  }, [loans, selectedMonth, statusFilter, searchQuery]);

  // Overall statistics for the cycles
  const stats = useMemo(() => {
    const total = loans.length;
    let activeCount = 0;
    let renewedCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let totalDuration = 0;
    let countedDuration = 0;

    loans.forEach((l) => {
      if (l.status === 'Dipinjam') activeCount++;
      else if (l.status === 'Terlambat') overdueCount++;
      else if (l.status === 'Kembali') completedCount++;

      if (l.renewalCount && l.renewalCount > 0) renewedCount++;
      if (l.cycleDurationDays && l.cycleDurationDays > 0) {
        totalDuration += l.cycleDurationDays;
        countedDuration++;
      }
    });

    const avgDuration = countedDuration > 0 ? (totalDuration / countedDuration).toFixed(1) : '7.0';
    const onTimeRate = total > 0 ? Math.round((completedCount / (total || 1)) * 100) : 0;

    return {
      total,
      activeCount,
      renewedCount,
      overdueCount,
      completedCount,
      avgDuration,
      onTimeRate,
    };
  }, [loans]);

  // Handle Perpanjangan Siklus (Renew Loan Cycle)
  const handleConfirmRenewal = () => {
    if (!renewingLoan) return;

    const currentRenewals = renewingLoan.renewalCount || 0;
    if (currentRenewals >= 2) return;

    const extensionDays = renewingLoan.memberRole === 'Guru' ? 14 : 7;
    const newDueDate = addDaysSkippingFriday(renewingLoan.dueDate, extensionDays);
    const now = getTodayDateString();

    const newEvent: LoanCycleEvent = {
      id: `cyc-${renewingLoan.id}-ren-${currentRenewals + 1}`,
      stage: 'Perpanjangan',
      date: now,
      time: '10:00',
      note: renewalNote.trim() || `Perpanjangan siklus ke-${currentRenewals + 1} (+${extensionDays} hari). Tenggat baru: ${newDueDate}`,
      officer: officerName,
      daysExtended: extensionDays,
      newDueDate,
    };

    const updatedHistory = [...(renewingLoan.cycleHistory || []), newEvent];

    const updatedLoan: LoanTransaction = {
      ...renewingLoan,
      dueDate: newDueDate,
      renewalCount: currentRenewals + 1,
      cycleStatus: 'Diperpanjang',
      status: 'Dipinjam', // Clears overdue if extended within allowable window
      overdueDays: 0,
      fineAmount: 0,
      notes: `${renewingLoan.notes || ''} [Diperpanjang ${currentRenewals + 1}x oleh ${officerName}]`.trim(),
      cycleHistory: updatedHistory,
    };

    onUpdateLoan(updatedLoan);
    if (selectedLoanForTimeline && selectedLoanForTimeline.id === renewingLoan.id) {
      setSelectedLoanForTimeline(updatedLoan);
    }
    setRenewingLoan(null);
    setRenewalNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-emerald-300 text-xs font-semibold mb-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Sirkulasi & Siklus Peminjaman Buku 2026</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Siklus Peminjaman Buku Perpustakaan
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Pelacakan menyeluruh siklus sirkulasi buku dari Januari 2026 hingga 2 November 2026 (Hari Ini). Memantau masa pinjam awal, perpanjangan siklus, peringatan jatuh tempo, hingga penyelesaian pengembalian buku.
            </p>
            {onSyncHistory && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSyncHistory}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan Siklus 2026 Dari Data Anggota & Buku Saya</span>
                </button>
              </div>
            )}
          </div>

          {/* Schedule Rule Badge */}
          <div className="bg-white/10 backdrop-blur p-3.5 rounded-xl border border-white/10 text-xs space-y-1.5 shrink-0 max-w-xs">
            <div className="flex items-center gap-2 text-emerald-200 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Aturan Kalender Siklus:</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              • <b>Setiap Jumat:</b> Libur Rutin (Tenggat digeser otomatis)<br />
              • <b>Setiap Minggu:</b> Layanan Aktif Perpustakaan<br />
              • <b>Maks. Perpanjangan:</b> 2x per transaksi (+7 hari)
            </p>
          </div>
        </div>
      </div>

      {/* Cycle Stage Pipeline Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Alur Siklus Hidup Peminjaman Buku (Lifecycle Pipeline)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Standar Sirkulasi MA Roudlotul Jadid
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center mb-1.5">
              1
            </span>
            <span className="text-xs font-bold text-teal-950">Peminjaman Baru</span>
            <span className="text-[10px] text-teal-700 mt-0.5">Siswa 7 hari, Guru 14 hari</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-1.5">
              2
            </span>
            <span className="text-xs font-bold text-emerald-950">Masa Pinjam Aktif</span>
            <span className="text-[10px] text-emerald-700 mt-0.5">Stok rak berkurang 1</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-1.5">
              3
            </span>
            <span className="text-xs font-bold text-blue-950">Perpanjangan (+7h)</span>
            <span className="text-[10px] text-blue-700 mt-0.5">Maksimal 2x perpanjangan</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center mb-1.5">
              4
            </span>
            <span className="text-xs font-bold text-amber-950">Peringatan Tenggat</span>
            <span className="text-[10px] text-amber-700 mt-0.5">Lewat tenggat: Rp 2.000/hari</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mb-1.5">
              5
            </span>
            <span className="text-xs font-bold text-purple-950">Cek Kondisi Buku</span>
            <span className="text-[10px] text-purple-700 mt-0.5">Verifikasi fisik & denda</span>
          </div>

          <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center mb-1.5">
              6
            </span>
            <span className="text-xs font-bold text-slate-800">Siklus Ditutup</span>
            <span className="text-[10px] text-slate-600 mt-0.5">Stok otomatis kembali</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Total Siklus 2026</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            1 Jan - 2 Nov 2026
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Siklus Sedang Berjalan</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats.activeCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Buku aktif dipinjam</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Pernah Diperpanjang</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{stats.renewedCount}</span>
          <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Memanfaatkan perpanjangan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Melewati Tenggat</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{stats.overdueCount}</span>
          <span className="text-[10px] text-rose-600 font-semibold mt-1 block">Denda berjalan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Rata-rata Durasi Siklus</span>
          <span className="text-2xl font-bold text-teal-800 mt-1 block">{stats.avgDuration} <span className="text-sm font-normal text-slate-500">hari</span></span>
          <span className="text-[10px] text-slate-500 mt-1 block">Tingkat tepat waktu {stats.onTimeRate}%</span>
        </div>
      </div>

      {/* Filter Bar: Months in 2026 + Search + Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Month Selector Chips */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Pilih Bulan Siklus 2026:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {months2026.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedMonth === m.key
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-slate-100">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode transaksi, judul buku, nama peminjam, atau DDC..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({loans.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Aktif ({stats.activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('RENEWED')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                statusFilter === 'RENEWED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Diperpanjang ({stats.renewedCount})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                statusFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Telat ({stats.overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                statusFilter === 'COMPLETED'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Selesai ({stats.completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Daftar Siklus Sirkulasi Buku ({filteredLoans.length} Transaksi)
          </span>
          <span className="text-[11px] text-slate-500">
            Klik transaksi untuk melihat diagram kronologis siklus lengkap
          </span>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada siklus peminjaman yang cocok</p>
            <p className="text-xs text-slate-400">Silakan ubah filter bulan atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <th className="py-3 px-4">Kode & Peminjam</th>
                  <th className="py-3 px-4">Buku & DDC</th>
                  <th className="py-3 px-4">Tanggal Pinjam</th>
                  <th className="py-3 px-4">Tenggat Waktu</th>
                  <th className="py-3 px-4">Perpanjangan</th>
                  <th className="py-3 px-4">Status Siklus</th>
                  <th className="py-3 px-4 text-right">Aksi Siklus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => {
                  const isOverdue = loan.status === 'Terlambat' || loan.overdueDays > 0;
                  const isReturned = loan.status === 'Kembali';
                  const renewalNum = loan.renewalCount || 0;
                  const canRenew = !isReturned && renewalNum < 2;

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLoanForTimeline(loan)}
                    >
                      {/* Kode & Peminjam */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-teal-800 block">
                          <HighlightMatch text={loan.transactionCode} query={searchQuery} />
                        </span>
                        <span className="font-semibold text-slate-800 block">
                          <HighlightMatch text={loan.memberName} query={searchQuery} />
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {loan.memberRole} • {loan.memberClass}
                        </span>
                      </td>

                      {/* Buku */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-800 block truncate" title={loan.bookTitle}>
                          <HighlightMatch text={loan.bookTitle} query={searchQuery} />
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {loan.bookCode} | {loan.bookCallNumber}
                        </span>
                      </td>

                      {/* Pinjam Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-700 block font-medium">
                          {formatDateIndo(loan.borrowDate)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Oleh: {loan.officer || 'Petugas'}
                        </span>
                      </td>

                      {/* Tenggat */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold block ${
                            isOverdue
                              ? 'text-rose-600 font-bold'
                              : isReturned
                              ? 'text-slate-500'
                              : 'text-emerald-700'
                          }`}
                        >
                          {formatDateIndo(loan.dueDate)}
                        </span>
                        {loan.originalDueDate && loan.originalDueDate !== loan.dueDate && (
                          <span className="text-[10px] text-slate-400 line-through block">
                            Awal: {loan.originalDueDate}
                          </span>
                        )}
                      </td>

                      {/* Perpanjangan */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renewalNum > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <RotateCcw className="w-2.5 h-2.5" />
                            {renewalNum}x Diperpanjang
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum pernah</span>
                        )}
                      </td>

                      {/* Status Siklus */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isReturned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Selesai Dikembalikan
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Telat {loan.overdueDays} Hari
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            Siklus Aktif
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {canRenew && (
                            <button
                              type="button"
                              onClick={() => {
                                setRenewingLoan(loan);
                                setRenewalNote('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[11px] border border-teal-200 flex items-center gap-1 transition-colors"
                              title="Perpanjang siklus masa pinjam +7 hari"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>+Perpanjang</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedLoanForTimeline(loan)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Lihat Timeline Kronologis Siklus"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Timeline Kronologis Siklus Peminjaman */}
      {selectedLoanForTimeline && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-300">
                  {selectedLoanForTimeline.transactionCode}
                </span>
                <h3 className="text-base font-bold mt-1">
                  Timeline Kronologis Siklus Peminjaman
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedLoanForTimeline.bookTitle} • {selectedLoanForTimeline.memberName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoanForTimeline(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Timeline */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary pill banner */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Pinjam</span>
                  <span className="font-semibold text-slate-800">{formatDateIndo(selectedLoanForTimeline.borrowDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Batas Pengembalian</span>
                  <span className="font-semibold text-slate-800">{formatDateIndo(selectedLoanForTimeline.dueDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Sirkulasi</span>
                  <span className="font-bold text-teal-800">
                    {selectedLoanForTimeline.status === 'Kembali'
                      ? 'Selesai (Kembali)'
                      : selectedLoanForTimeline.status === 'Terlambat'
                      ? 'Terlambat'
                      : 'Aktif Dipinjam'}
                  </span>
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Riwayat Perjalanan Siklus (Chronology):
                </h4>

                <div className="relative border-l-2 border-teal-500/30 ml-4 space-y-5">
                  {(selectedLoanForTimeline.cycleHistory && selectedLoanForTimeline.cycleHistory.length > 0
                    ? selectedLoanForTimeline.cycleHistory
                    : [
                        {
                          id: 'initial',
                          stage: 'Peminjaman Baru' as const,
                          date: selectedLoanForTimeline.borrowDate,
                          time: '08:00',
                          note: `Peminjaman baru disetujui. Tenggat awal: ${selectedLoanForTimeline.dueDate}`,
                          officer: selectedLoanForTimeline.officer,
                        },
                        ...(selectedLoanForTimeline.status === 'Kembali' && selectedLoanForTimeline.returnDate
                          ? [
                              {
                                id: 'ret',
                                stage: 'Pengembalian Tepat Waktu' as const,
                                date: selectedLoanForTimeline.returnDate,
                                time: '12:00',
                                note: 'Buku dikembalikan ke perpustakaan dalam kondisi baik.',
                                officer: selectedLoanForTimeline.officer,
                              },
                            ]
                          : []),
                      ]
                  ).map((ev, idx) => (
                    <div key={ev.id || idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{ev.stage}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatDateIndo(ev.date)} {ev.time ? `• ${ev.time}` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ev.note}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                          <ShieldCheck className="w-3 h-3 text-teal-600" />
                          <span>Divalidasi oleh: {ev.officer || 'Petugas Perpustakaan'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total perpanjangan: <b>{selectedLoanForTimeline.renewalCount || 0}/2 kali</b>
              </div>
              <div className="flex items-center gap-2">
                {selectedLoanForTimeline.status !== 'Kembali' && (selectedLoanForTimeline.renewalCount || 0) < 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRenewingLoan(selectedLoanForTimeline);
                      setRenewalNote('');
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Perpanjang Siklus (+7 Hari)</span>
                  </button>
                )}
                {onPrintSlip && (
                  <button
                    type="button"
                    onClick={() => onPrintSlip(selectedLoanForTimeline)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Slip</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLoanForTimeline(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dialog Perpanjang Siklus */}
      {renewingLoan && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">
                  Perpanjang Siklus Masa Pinjam
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRenewingLoan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold text-teal-950">{renewingLoan.bookTitle}</p>
              <p className="text-teal-800">Peminjam: {renewingLoan.memberName} ({renewingLoan.memberClass})</p>
              <p className="text-teal-700 text-[11px]">
                Tenggat Saat Ini: <b>{formatDateIndo(renewingLoan.dueDate)}</b> &rarr; Tenggat Baru:{' '}
                <b className="text-emerald-700">
                  {formatDateIndo(
                    addDaysSkippingFriday(
                      renewingLoan.dueDate,
                      renewingLoan.memberRole === 'Guru' ? 14 : 7
                    )
                  )}
                </b>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Catatan Petugas (Opsional)
              </label>
              <input
                type="text"
                value={renewalNote}
                onChange={(e) => setRenewalNote(e.target.value)}
                placeholder="Misal: Perpanjangan untuk keperluan ujian madrasah"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Petugas yang Mengesahkan
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenewingLoan(null)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewal}
                className="px-4 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-600 active:scale-95 text-white rounded-lg transition-all"
              >
                Sah & Simpan Perpanjangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
