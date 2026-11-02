import React, { useState } from 'react';
import {
  ArrowUpRight,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Printer,
  Clock,
  Search,
  Plus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Book, Member, LoanTransaction, LibrarySettings } from '../../types/library';
import { formatDateIndo, getTodayDateString, addDays } from '../../utils/formatters';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../../utils/datePeriods';
import { PeriodFilterBar } from '../Common/PeriodFilterBar';
import { HighlightMatch } from '../Common/HighlightMatch';

interface BorrowCirculationProps {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  settings: LibrarySettings;
  onAddLoan: (loan: LoanTransaction) => void;
  onPrintSlip: (loan: LoanTransaction) => void;
  onNavigateToReturns: () => void;
  onNavigateToCycles?: () => void;
}

export const BorrowCirculation: React.FC<BorrowCirculationProps> = ({
  books,
  members,
  loans,
  settings,
  onAddLoan,
  onPrintSlip,
  onNavigateToReturns,
  onNavigateToCycles,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [viewFilter, setViewFilter] = useState<'active' | 'all-period'>('active');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowDate, setBorrowDate] = useState(getTodayDateString());
  const [borrowDays, setBorrowDays] = useState(settings.maxBorrowDaysStudent);
  const [notes, setNotes] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastCreatedLoan, setLastCreatedLoan] = useState<LoanTransaction | null>(null);

  // Active loans
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');

  // Filtered by selected period
  const loansInPeriod = loans.filter((l) => isDateInPeriod(l.borrowDate, selectedPeriod));
  const activeInPeriod = loansInPeriod.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');

  // Student vs Teacher in period
  const studentLoansPeriod = loansInPeriod.filter((l) => l.memberRole === 'Siswa').length;
  const teacherLoansPeriod = loansInPeriod.filter((l) => l.memberRole === 'Guru' || l.memberRole === 'Staf').length;

  // Selected member details
  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Calculate active loans count for selected member
  const memberActiveLoans = activeLoans.filter((l) => l.memberId === selectedMemberId);
  const memberOverdueLoans = memberActiveLoans.filter((l) => l.status === 'Terlambat' || l.overdueDays > 0);

  const maxAllowedBooks =
    selectedMember?.role === 'Guru' ? settings.maxBooksTeacher : settings.maxBooksStudent;
  const isQuotaExceeded = memberActiveLoans.length >= maxAllowedBooks;
  const hasOverdueLock = memberOverdueLoans.length > 0;

  // Selected book details
  const selectedBook = books.find((b) => b.id === selectedBookId);

  // Due date calculation
  const dueDate = addDays(borrowDate, borrowDays);

  // Filter members list for search
  const filteredMembers = members.filter((m) => {
    if (!memberSearchQuery) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.nisn_nip.toLowerCase().includes(q) ||
      m.classOrDept.toLowerCase().includes(q)
    );
  });

  // Filter available books for search
  const availableBooks = books.filter((b) => b.availableCopies > 0);
  const filteredBooks = availableBooks.filter((b) => {
    if (!bookSearchQuery) return true;
    const q = bookSearchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.callNumber.toLowerCase().includes(q)
    );
  });

  // Handle member selection
  const handleSelectMember = (member: Member) => {
    setSelectedMemberId(member.id);
    setMemberSearchQuery(`${member.name} (${member.classOrDept})`);
    // Adjust borrow duration default
    const duration =
      member.role === 'Guru' ? settings.maxBorrowDaysTeacher : settings.maxBorrowDaysStudent;
    setBorrowDays(duration);
  };

  // Handle book selection
  const handleSelectBook = (book: Book) => {
    setSelectedBookId(book.id);
    setBookSearchQuery(`${book.title} [${book.callNumber}]`);
  };

  // Submit loan
  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedBook) return;

    if (hasOverdueLock) {
      alert(
        `Anggota ${selectedMember.name} masih memiliki tanggungan ${memberOverdueLoans.length} buku terlambat. Harap selesaikan pengembalian terlebih dahulu!`
      );
      return;
    }

    if (isQuotaExceeded) {
      alert(
        `Anggota ${selectedMember.name} telah mencapai batas peminjaman maksimal (${maxAllowedBooks} buku).`
      );
      return;
    }

    const nextId = `trx-${Date.now()}`;
    const code = `TRX-${borrowDate.replace(/-/g, '').slice(0, 6)}-${String(
      loans.length + 1
    ).padStart(3, '0')}`;

    const newLoan: LoanTransaction = {
      id: nextId,
      transactionCode: code,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberRole: selectedMember.role,
      memberClass: selectedMember.classOrDept,
      bookId: selectedBook.id,
      bookCode: selectedBook.code,
      bookTitle: selectedBook.title,
      bookCallNumber: selectedBook.callNumber,
      borrowDate,
      dueDate,
      status: 'Dipinjam',
      overdueDays: 0,
      fineAmount: 0,
      finePaid: false,
      notes,
      borrowCondition: selectedBook.condition,
      officer: settings.headLibrarian,
      renewalCount: 0,
      maxRenewals: 2,
      cycleStatus: 'Berjalan',
      originalDueDate: dueDate,
      cycleDurationDays: 1,
      cycleHistory: [
        {
          id: `cyc-${nextId}-1`,
          stage: 'Peminjaman Baru',
          date: borrowDate,
          time: '08:30',
          note: `Peminjaman baru disetujui petugas. Batas kembali awal: ${dueDate}`,
          officer: settings.headLibrarian,
        },
      ],
    };

    onAddLoan(newLoan);
    setLastCreatedLoan(newLoan);
    setIsSuccessModalOpen(true);

    // Reset inputs
    setSelectedBookId('');
    setBookSearchQuery('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            Sirkulasi Peminjaman Buku
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formulir peminjaman terverifikasi otomatis dengan pembatasan kuota dan batas waktu
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onNavigateToCycles && (
            <button
              onClick={onNavigateToCycles}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span>Siklus Peminjaman Buku</span>
            </button>
          )}
          <button
            onClick={onNavigateToReturns}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <span>Ke Pengembalian & Denda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Form, Right Active List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Peminjaman (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">Formulir Peminjaman Baru</h2>
          </div>

          <form onSubmit={handleSubmitLoan} className="space-y-4 text-xs">
            {/* Step 1: Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Pilih Anggota (Siswa / Guru) <span className="text-rose-500">*</span>
                </label>
                {selectedMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId('');
                      setMemberSearchQuery('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-medium"
                  >
                    Ganti Anggota
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik huruf nama siswa, guru, atau NISN..."
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                    if (selectedMemberId) setSelectedMemberId('');
                  }}
                  className="w-full pl-8 pr-7 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 font-medium"
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearchQuery('');
                      setSelectedMemberId('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Member search dropdown recommendations */}
              {!selectedMemberId && memberSearchQuery.trim() && (
                <div className="mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 z-20 animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                    <span>Rekomendasi Anggota ({filteredMembers.length})</span>
                    <span className="text-[9px] font-normal text-slate-400">Pilih untuk isi otomatis</span>
                  </div>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.slice(0, 8).map((m) => {
                      const mLoans = activeLoans.filter((l) => l.memberId === m.id);
                      const mOverdue = mLoans.filter((l) => l.status === 'Terlambat' || l.overdueDays > 0);
                      const maxBooks = m.role === 'Guru' ? settings.maxBooksTeacher : settings.maxBooksStudent;
                      const isFull = mLoans.length >= maxBooks;

                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleSelectMember(m)}
                          className="w-full text-left p-2 hover:bg-emerald-50/80 rounded-lg text-slate-800 flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <div
                              className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                m.avatarColor || 'bg-emerald-600'
                              }`}
                            >
                              {m.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700">
                                <HighlightMatch text={m.name} query={memberSearchQuery} />
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {m.role} • <HighlightMatch text={m.classOrDept} query={memberSearchQuery} /> • NISN/NIP:{' '}
                                <HighlightMatch text={m.nisn_nip} query={memberSearchQuery} />
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {mOverdue.length > 0 ? (
                              <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                                Terlambat {mOverdue.length}
                              </span>
                            ) : isFull ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                Kuota Penuh ({mLoans.length})
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                                {mLoans.length}/{maxBooks} Pinjam
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-slate-400 text-center text-[11px]">
                      Tidak ada anggota yang cocok dengan huruf "{memberSearchQuery}"
                    </div>
                  )}
                </div>
              )}

              {/* Selected Member Status Card */}
              {selectedMember && (
                <div
                  className={`mt-2 p-3 rounded-xl border text-[11px] ${
                    hasOverdueLock
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : isQuotaExceeded
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{selectedMember.name}</span>
                    <span>{selectedMember.role} • {selectedMember.classOrDept}</span>
                  </div>
                  <div className="mt-1 text-slate-600 flex items-center justify-between">
                    <span>Kuota Peminjaman:</span>
                    <span className="font-semibold">
                      {memberActiveLoans.length} / {maxAllowedBooks} Buku Aktif
                    </span>
                  </div>

                  {hasOverdueLock && (
                    <div className="mt-1.5 pt-1.5 border-t border-rose-200 text-rose-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Akun terkunci: Memiliki {memberOverdueLoans.length} buku terlambat!</span>
                    </div>
                  )}

                  {isQuotaExceeded && !hasOverdueLock && (
                    <div className="mt-1.5 pt-1.5 border-t border-amber-200 text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Batas kuota tercapai ({maxAllowedBooks} buku).</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Book Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Pilih Buku Koleksi <span className="text-rose-500">*</span>
                </label>
                {selectedBook && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookId('');
                      setBookSearchQuery('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-medium"
                  >
                    Ganti Buku
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik huruf judul buku, penulis, atau nomor panggil..."
                  value={bookSearchQuery}
                  onChange={(e) => {
                    setBookSearchQuery(e.target.value);
                    if (selectedBookId) setSelectedBookId('');
                  }}
                  className="w-full pl-8 pr-7 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 font-medium"
                />
                {bookSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookSearchQuery('');
                      setSelectedBookId('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Book search dropdown recommendations */}
              {!selectedBookId && bookSearchQuery.trim() && (
                <div className="mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 z-20 animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                    <span>Rekomendasi Buku ({filteredBooks.length})</span>
                    <span className="text-[9px] font-normal text-slate-400">Pilih untuk isi otomatis</span>
                  </div>
                  {filteredBooks.length > 0 ? (
                    filteredBooks.slice(0, 8).map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => handleSelectBook(b)}
                        className="w-full text-left p-2 hover:bg-emerald-50/80 rounded-lg text-slate-800 flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
                      >
                        <div className="overflow-hidden pr-2 flex items-center gap-2.5">
                          <div className="w-7 h-9 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 group-hover:border-emerald-300">
                            {b.coverUrl ? (
                              <img src={b.coverUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700">
                              <HighlightMatch text={b.title} query={bookSearchQuery} />
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              Penulis: <HighlightMatch text={b.author} query={bookSearchQuery} /> • Rak: {b.rack}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">
                              Kode: <HighlightMatch text={b.code} query={bookSearchQuery} /> • Panggil: {b.callNumber}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-emerald-200 shrink-0">
                          Sisa {b.availableCopies}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-slate-400 text-center text-[11px]">
                      Tidak ada buku yang cocok dengan huruf "{bookSearchQuery}" atau stok habis
                    </div>
                  )}
                </div>
              )}

              {/* Selected Book Card */}
              {selectedBook && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                  <div className="font-bold text-slate-900">{selectedBook.title}</div>
                  <div className="text-slate-500 mt-0.5">
                    No Panggil: <span className="font-mono font-bold text-slate-700">{selectedBook.callNumber}</span> • {selectedBook.rack}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-slate-600">
                    <span>Kondisi Awal: <b className="text-emerald-700">{selectedBook.condition}</b></span>
                    <span>Tersedia: <b>{selectedBook.availableCopies}</b> eks</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Dates and Durations */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pinjam</label>
                <input
                  type="date"
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Durasi Hari</label>
                <select
                  value={borrowDays}
                  onChange={(e) => setBorrowDays(parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800"
                >
                  <option value={3}>3 Hari (Khusus)</option>
                  <option value={7}>7 Hari (Standar Siswa)</option>
                  <option value={14}>14 Hari (Standar Guru)</option>
                  <option value={21}>21 Hari (Proyek)</option>
                </select>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700">
                <span className="font-medium">Batas Pengembalian:</span>
                <span className="font-bold text-emerald-700">{formatDateIndo(dueDate)}</span>
              </div>
            </div>

            {/* Step 4: Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Keperluan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Tugas KTI Biologi / Olimpiade"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedMember || !selectedBook || hasOverdueLock || isQuotaExceeded}
              className={`w-full py-2.5 text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                !selectedMember || !selectedBook || hasOverdueLock || isQuotaExceeded
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-[1.01]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Simpan Transaksi Peminjaman</span>
            </button>
          </form>
        </div>

        {/* List of Active & Periodic Loans (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          {/* Rekapitulasi Periode Bar */}
          <PeriodFilterBar
            selectedPeriod={selectedPeriod}
            onPeriodChange={(p) => setSelectedPeriod(p)}
            title="Rekapitulasi Peminjaman:"
            summaryText={`${loansInPeriod.length} Transaksi (${studentLoansPeriod} Siswa, ${teacherLoansPeriod} Guru)`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                {viewFilter === 'active' ? 'Peminjaman Aktif di Tangan Siswa' : `Semua Peminjaman (${getPeriodLabel(selectedPeriod)})`}
              </h2>
              <p className="text-xs text-slate-500">
                {viewFilter === 'active'
                  ? `${activeLoans.length} buku sedang dipinjam saat ini`
                  : `${loansInPeriod.length} transaksi sirkulasi dalam periode terpilih`}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setViewFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  viewFilter === 'active'
                    ? 'bg-white shadow text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif ({activeLoans.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('all-period')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  viewFilter === 'all-period'
                    ? 'bg-white shadow text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Periode ({loansInPeriod.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Kode / Siswa</th>
                  <th className="py-2.5 px-3">Judul Buku</th>
                  <th className="py-2.5 px-3">Tgl Pinjam / Batas</th>
                  <th className="py-2.5 px-3 text-right">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(viewFilter === 'active' ? activeLoans : loansInPeriod).length > 0 ? (
                  (viewFilter === 'active' ? activeLoans : loansInPeriod).map((loan) => {
                    const isOverdue = loan.status === 'Terlambat' || loan.overdueDays > 0;
                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{loan.memberName}</div>
                          <div className="text-[10px] text-slate-400">
                            {loan.memberClass} • <span className="font-mono">{loan.transactionCode}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-medium text-slate-800 truncate" title={loan.bookTitle}>
                            {loan.bookTitle}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {loan.bookCallNumber}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-[11px] text-slate-500">
                            Pinjam: {formatDateIndo(loan.borrowDate)}
                          </div>
                          <div className="font-medium text-slate-800">
                            Tempo: {formatDateIndo(loan.dueDate)}
                          </div>
                          <div className="mt-0.5">
                            {loan.status === 'Kembali' ? (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                Selesai Kembali ({formatDateIndo(loan.returnDate)})
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                Terlambat {loan.overdueDays} hari
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                                Sedang Berjalan
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => onPrintSlip(loan)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-medium transition-colors"
                            title="Cetak Slip Peminjaman"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Tidak ada transaksi peminjaman dalam periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL with instant Print Slip button */}
      {isSuccessModalOpen && lastCreatedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-900">Peminjaman Berhasil Dicatat!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data sirkulasi telah tersimpan dan stok buku otomatis diperbarui.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Transaksi:</span>
                <span className="font-mono font-bold text-slate-800">
                  {lastCreatedLoan.transactionCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam:</span>
                <span className="font-semibold text-slate-800">
                  {lastCreatedLoan.memberName} ({lastCreatedLoan.memberClass})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buku:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {lastCreatedLoan.bookTitle}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Batas Pengembalian:</span>
                <span className="font-bold text-emerald-700">
                  {formatDateIndo(lastCreatedLoan.dueDate)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Selesai
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  onPrintSlip(lastCreatedLoan);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Bukti Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
