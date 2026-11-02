import React from 'react';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings } from '../types/library';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../utils/datePeriods';
import { PeriodFilterBar } from './Common/PeriodFilterBar';

interface DashboardProps {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  visitors: VisitorLog[];
  settings: LibrarySettings;
  onNavigateTab: (tab: 'inventory' | 'loans' | 'returns' | 'members' | 'visitors' | 'reports' | 'add-book' | 'add-member' | 'add-visitor' | 'admins' | 'ebooks') => void;
  onOpenQuickBorrow: () => void;
  onOpenQuickReturn: () => void;
  onOpenAddBook: () => void;
  onOpenAddMember: () => void;
  onOpenVisitorModal: () => void;
  onSelectBook: (book: Book) => void;
  onSyncHistory?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  members,
  loans,
  visitors,
  settings,
  onNavigateTab,
  onOpenQuickBorrow,
  onOpenQuickReturn,
  onOpenAddBook,
  onOpenAddMember,
  onOpenVisitorModal,
  onSelectBook,
  onSyncHistory,
}) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('month');

  // Filtered collections based on period
  const periodLoans = loans.filter((l) => isDateInPeriod(l.borrowDate, selectedPeriod));
  const periodReturns = loans.filter((l) => l.returnDate && isDateInPeriod(l.returnDate, selectedPeriod));
  const periodVisitors = visitors.filter((v) => isDateInPeriod(v.date, selectedPeriod));
  const periodFines = periodReturns.reduce((acc, l) => acc + (l.finePaid ? l.fineAmount : 0), 0);
  const periodPendingFines = loans
    .filter((l) => isDateInPeriod(l.dueDate, selectedPeriod) && (l.status === 'Terlambat' || l.overdueDays > 0))
    .reduce((acc, l) => acc + (l.finePaid ? 0 : l.fineAmount), 0);

  // Overall Totals
  const totalTitles = books.length;
  const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const borrowedCopies = totalCopies - availableCopies;

  const activeLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const overdueLoans = loans.filter((l) => l.status === 'Terlambat' || l.overdueDays > 0);
  const totalFineOwed = overdueLoans.reduce((acc, l) => acc + (l.finePaid ? 0 : l.fineAmount), 0);
  
  const activeMembersCount = members.filter((m) => m.status === 'Aktif').length;

  // Most popular books (based on loan counts in period)
  const bookBorrowCounts: Record<string, number> = {};
  periodLoans.forEach((l) => {
    bookBorrowCounts[l.bookId] = (bookBorrowCounts[l.bookId] || 0) + 1;
  });

  const popularBooks = [...books]
    .map((b) => ({ ...b, borrowCount: bookBorrowCounts[b.id] || 0 }))
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 4);

  // Recent 5 loans in period or global fallback
  const recentLoans = periodLoans.length > 0 ? periodLoans.slice(0, 5) : loans.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 md:p-8 shadow-lg shadow-slate-900/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Otomasi Perpustakaan Sekolah Terintegrasi</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Jadwal: Jumat Libur • Minggu Masuk Sekolah</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-white">
            Selamat Datang di {settings.libraryName}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
            Kelola inventaris koleksi buku, sirkulasi peminjaman siswa dan guru, cetak kartu anggota, serta pemantauan denda keterlambatan secara otomatis.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuickBorrow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Transaksi Peminjaman</span>
            </button>
            <button
              onClick={onOpenQuickReturn}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium rounded-xl text-xs transition-all backdrop-blur"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Proses Pengembalian</span>
            </button>
            <button
              onClick={onOpenAddBook}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium rounded-xl text-xs transition-all backdrop-blur"
            >
              <BookOpen className="w-4 h-4" />
              <span>+ Tambah Buku</span>
            </button>
            <button
              onClick={onOpenAddMember}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium rounded-xl text-xs transition-all backdrop-blur"
            >
              <Users className="w-4 h-4" />
              <span>+ Tambah Anggota</span>
            </button>
            <button
              onClick={() => (onNavigateTab as any)('ebooks')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600/30 hover:bg-rose-600/40 text-rose-100 border border-rose-400/30 font-medium rounded-xl text-xs transition-all backdrop-blur"
            >
              <FileText className="w-4 h-4 text-rose-300" />
              <span>Koleksi E-Book PDF</span>
            </button>
            {onSyncHistory && (
              <button
                onClick={onSyncHistory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Sinkronkan Siklus & Kunjungan 2026</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Critical Overdue Warning Banner if any */}
      {overdueLoans.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-950">
                Peringatan: {overdueLoans.length} Peminjaman Melewati Batas Waktu
              </h3>
              <p className="text-xs text-amber-800">
                Total denda berjalan: <span className="font-bold">{formatRupiah(totalFineOwed)}</span> ({formatRupiah(settings.finePerDay)}/hari). Segera lakukan penagihan buku.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('returns')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors whitespace-nowrap self-end sm:self-auto"
          >
            Lihat & Proses Kembali
          </button>
        </div>
      )}

      {/* Period Filter for Rekapitulasi */}
      <PeriodFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={(p) => setSelectedPeriod(p)}
        title="Rekapitulasi Aktivitas Berdasarkan Waktu:"
        summaryText={`${periodLoans.length} Pinjam • ${periodReturns.length} Kembali • ${periodVisitors.length} Kunjungan`}
      />

      {/* Dynamic Rekapitulasi Metric Cards based on Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rekap Pinjaman Periode */}
        <div
          onClick={() => onNavigateTab('loans')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pinjaman Periode Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {periodLoans.length} <span className="text-xs font-normal text-slate-500">Buku</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {getPeriodLabel(selectedPeriod)}
          </div>
        </div>

        {/* Rekap Pengembalian Periode */}
        <div
          onClick={() => onNavigateTab('returns')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Buku Dikembalikan
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {periodReturns.length} <span className="text-xs font-normal text-slate-500">Buku</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Pengembalian selesai
          </div>
        </div>

        {/* Rekap Denda Kas Periode */}
        <div
          onClick={() => onNavigateTab('returns')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kas Denda Periode Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {formatRupiah(periodFines)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Tertunggak: {formatRupiah(periodPendingFines)}
          </div>
        </div>

        {/* Rekap Pengunjung Periode */}
        <div
          onClick={() => onNavigateTab('visitors')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kunjungan Siswa/Guru
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {periodVisitors.length} <span className="text-xs font-normal text-slate-500">Orang</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Buku tamu tercatat
          </div>
        </div>
      </div>

      {/* Master Inventory Overview Heading */}
      <div className="pt-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">
          Status Keseluruhan Koleksi & Inventaris
        </h2>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inventaris Buku */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Buku
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            {totalTitles} <span className="text-xs font-normal text-slate-500">Judul</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Fisik: <b className="text-slate-800">{totalCopies}</b> eks</span>
            <span className="text-emerald-600 font-medium">Tersedia {availableCopies}</span>
          </div>
        </div>

        {/* Card 2: Sedang Dipinjam */}
        <div
          onClick={() => onNavigateTab('loans')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sedang Dipinjam
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            {activeLoans.length} <span className="text-xs font-normal text-slate-500">Buku</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Sirkulasi Aktif</span>
            <span className="text-slate-500">{borrowedCopies} eksemplar di luar</span>
          </div>
        </div>

        {/* Card 3: Terlambat & Denda */}
        <div
          onClick={() => onNavigateTab('returns')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Terlambat
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-600">
            {overdueLoans.length} <span className="text-xs font-normal text-slate-500">Transaksi</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Estimasi Denda:</span>
            <span className="font-bold text-rose-700">{formatRupiah(totalFineOwed)}</span>
          </div>
        </div>

        {/* Card 4: Anggota Terdaftar */}
        <div
          onClick={() => onNavigateTab('members')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Anggota Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            {activeMembersCount} <span className="text-xs font-normal text-slate-500">Orang</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Siswa & Guru</span>
            <span className="text-purple-600 font-medium">Kartu Terbit</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Activity & Top Books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Aktivitas Sirkulasi Terkini</h2>
              <p className="text-xs text-slate-500">Peminjaman dan pengembalian buku terbaru</p>
            </div>
            <button
              onClick={() => onNavigateTab('loans')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>Semua Sirkulasi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-1">Peminjam</th>
                  <th className="pb-3">Judul Buku</th>
                  <th className="pb-3">Tgl Pinjam / Jatuh Tempo</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-1">
                      <div className="font-semibold text-slate-800">{loan.memberName}</div>
                      <div className="text-[11px] text-slate-500">
                        {loan.memberRole} • {loan.memberClass}
                      </div>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="font-medium text-slate-800 max-w-xs truncate" title={loan.bookTitle}>
                        {loan.bookTitle}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {loan.bookCallNumber}
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">
                      <div>Pinjam: {formatDateIndo(loan.borrowDate)}</div>
                      <div className="text-[11px] font-semibold text-slate-700">
                        Tempo: {formatDateIndo(loan.dueDate)}
                      </div>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {loan.status === 'Kembali' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Kembali
                        </span>
                      ) : loan.status === 'Terlambat' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Terlambat ({loan.overdueDays} hr)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          Dipinjam
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Favorite Books & Inventory Breakdown (1 col) */}
        <div className="space-y-6">
          {/* Top Books */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-sm text-slate-900">Buku Terpopuler</h2>
              </div>
              <span className="text-[11px] text-slate-400">Banyak Dipinjam</span>
            </div>

            <div className="space-y-3">
              {popularBooks.map((book, idx) => (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-5 text-center text-xs font-bold text-slate-400 group-hover:text-emerald-600">
                      #{idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                        {book.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {book.author} • {book.rack}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {book.borrowCount}x Pinjam
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Presensi Tamu Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-slate-900">Pengunjung Terkini</h2>
              <button
                onClick={onOpenVisitorModal}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                + Presensi Baru
              </button>
            </div>
            <div className="space-y-2">
              {visitors.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-semibold text-slate-800">{v.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({v.classOrDept})</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {v.time} • {v.purpose}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
