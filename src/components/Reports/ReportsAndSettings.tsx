import React, { useState } from 'react';
import {
  FileBarChart2,
  Settings,
  Printer,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Building2,
  DollarSign,
  Clock,
  BookOpen,
  Users,
  ShieldCheck,
  Calendar,
  Sparkles,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings } from '../../types/library';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { exportAllData, resetToDefaultData } from '../../utils/storage';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../../utils/datePeriods';
import { PeriodFilterBar } from '../Common/PeriodFilterBar';

interface ReportsAndSettingsProps {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  visitors: VisitorLog[];
  settings: LibrarySettings;
  onUpdateSettings: (newSettings: LibrarySettings) => void;
  onPrintOfficialReport: (period: TimePeriod) => void;
  onDataRestored: () => void;
  onGenerateHistory?: () => void;
  onOpenAppsScript?: () => void;
}

export const ReportsAndSettings: React.FC<ReportsAndSettingsProps> = ({
  books,
  members,
  loans,
  visitors,
  settings,
  onUpdateSettings,
  onPrintOfficialReport,
  onDataRestored,
  onGenerateHistory,
  onOpenAppsScript,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'settings' | 'backup'>('reports');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [settingsForm, setSettingsForm] = useState<LibrarySettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Period-based calculations
  const periodLoans = loans.filter((l) => isDateInPeriod(l.borrowDate, selectedPeriod));
  const periodReturns = loans.filter((l) => l.returnDate && isDateInPeriod(l.returnDate, selectedPeriod));
  const periodVisitors = visitors.filter((v) => isDateInPeriod(v.date, selectedPeriod));

  const totalFineCollected = periodReturns
    .filter((l) => l.finePaid && l.fineAmount > 0)
    .reduce((acc, l) => acc + l.fineAmount, 0);

  const totalFinePending = loans
    .filter((l) => isDateInPeriod(l.dueDate, selectedPeriod) && (l.status === 'Terlambat' || l.overdueDays > 0) && !l.finePaid)
    .reduce((acc, l) => acc + l.fineAmount, 0);

  // Category breakdown
  const categoryCounts: Record<string, { titles: number; copies: number }> = {};
  books.forEach((b) => {
    if (!categoryCounts[b.category]) {
      categoryCounts[b.category] = { titles: 0, copies: 0 };
    }
    categoryCounts[b.category].titles += 1;
    categoryCounts[b.category].copies += b.totalCopies;
  });

  // Handle settings form submit
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.books && parsed.members && parsed.loans) {
          localStorage.setItem('pustaka_books_v1', JSON.stringify(parsed.books));
          localStorage.setItem('pustaka_members_v1', JSON.stringify(parsed.members));
          localStorage.setItem('pustaka_loans_v1', JSON.stringify(parsed.loans));
          if (parsed.visitors) {
            localStorage.setItem('pustaka_visitors_v1', JSON.stringify(parsed.visitors));
          }
          if (parsed.settings) {
            localStorage.setItem('pustaka_settings_v1', JSON.stringify(parsed.settings));
          }
          alert('Data perpustakaan berhasil dipulihkan dari file cadangan!');
          onDataRestored();
        } else {
          alert('Format file JSON tidak sesuai dengan skema perpustakaan.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin mengatur ulang data ke data percontohan default? Semua penambahan baru akan kembali ke awal.'
      )
    ) {
      resetToDefaultData();
      onDataRestored();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-emerald-600" />
            Laporan, Statistik & Pengaturan Perpustakaan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi berkala, cetak lembar pengesahan, dan konfigurasi profil operasional
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-white shadow text-slate-900 font-semibold'
                : 'text-slate-500'
            }`}
          >
            Laporan & Rekap
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-white shadow text-slate-900 font-semibold'
                : 'text-slate-500'
            }`}
          >
            Profil & Aturan
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              activeTab === 'backup'
                ? 'bg-white shadow text-slate-900 font-semibold'
                : 'text-slate-500'
            }`}
          >
            Cadangan & Reset
          </button>
        </div>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Operational notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Jadwal Operasional Madrasah:</strong> Setiap hari Jumat libur penuh (0 aktivitas), hari Minggu tetap aktif masuk sekolah.
              </span>
            </div>
            {onGenerateHistory && (
              <button
                onClick={onGenerateHistory}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded-lg text-[11px] transition-colors self-start sm:self-auto shrink-0 shadow-xs"
                title="Perbarui riwayat kunjungan dan peminjaman acak dari Januari 2026 hingga sekarang"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Riwayat 2026</span>
              </button>
            )}
          </div>

          {/* Universal Period Filter Bar */}
          <PeriodFilterBar
            selectedPeriod={selectedPeriod}
            onPeriodChange={(p) => setSelectedPeriod(p)}
            title="Pilih Periode Rekapitulasi Laporan:"
            summaryText={`${periodLoans.length} Pinjam • ${periodReturns.length} Kembali • ${periodVisitors.length} Kunjungan`}
          />

          {/* Action bar for printing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-950">
            <div>
              <h2 className="font-bold text-sm">Lembar Rekapitulasi Resmi Sekolah</h2>
              <p className="text-xs text-emerald-800">
                Format standar untuk pelaporan ({getPeriodLabel(selectedPeriod)}) kepada Kepala Sekolah dan Pengawas
              </p>
            </div>
            <button
              onClick={() => onPrintOfficialReport(selectedPeriod)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all shrink-0 self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekapitulasi ({getPeriodLabel(selectedPeriod).split(' ')[0]})</span>
            </button>
          </div>

          {/* Financial and operational summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Peminjaman Periode
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{periodLoans.length} Transaksi</div>
              <div className="text-xs text-slate-500 mt-2">
                {periodReturns.length} Selesai Dikembalikan
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Kas Denda Terkumpul
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {formatRupiah(totalFineCollected)}
              </div>
              <div className="text-xs text-slate-500 mt-2">Masuk ke kas buku</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Tunggakan Denda
              </span>
              <div className="text-2xl font-extrabold text-rose-600">
                {formatRupiah(totalFinePending)}
              </div>
              <div className="text-xs text-slate-500 mt-2">Masih berjalan</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Pengunjung Perpus
              </span>
              <div className="text-2xl font-extrabold text-purple-700">
                {periodVisitors.length} Orang
              </div>
              <div className="text-xs text-slate-500 mt-2">Presensi buku tamu</div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Rekapitulasi Koleksi per Klasifikasi DDC
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi judul dan eksemplar fisik buku di perpustakaan
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Klasifikasi / Kategori</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Judul</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Eksemplar</th>
                    <th className="py-2.5 px-3 text-right">Persentase Koleksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(categoryCounts).map(([cat, count]) => {
                    const totalAllCopies = books.reduce((a, b) => a + b.totalCopies, 0);
                    const pct = totalAllCopies > 0 ? Math.round((count.copies / totalAllCopies) * 100) : 0;
                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-medium text-slate-800">{cat}</td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {count.titles}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {count.copies} eks
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <span className="font-mono text-slate-600">{pct}%</span>
                            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="font-bold text-base text-slate-900">Konfigurasi Profil Perpustakaan</h2>
              <p className="text-xs text-slate-500">
                Data ini dicetak pada kartu anggota, barcode buku, struk peminjaman, dan kop laporan
              </p>
            </div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5" />
                Pengaturan Tersimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  value={settingsForm.schoolName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, schoolName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Perpustakaan</label>
                <input
                  type="text"
                  required
                  value={settingsForm.libraryName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, libraryName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NPSN Sekolah</label>
                <input
                  type="text"
                  value={settingsForm.npsn}
                  onChange={(e) => setSettingsForm({ ...settingsForm, npsn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Sekolah</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={settingsForm.headmaster}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, headmaster: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kepala Perpustakaan
                </label>
                <input
                  type="text"
                  value={settingsForm.headLibrarian}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, headLibrarian: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP Petugas</label>
                <input
                  type="text"
                  value={settingsForm.librarianNip}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, librarianNip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Aturan Denda & Durasi */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 pt-4">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                Aturan Batas Waktu & Denda
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tarif Denda (Rp/Hari)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={settingsForm.finePerDay}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        finePerDay: parseInt(e.target.value) || 2000,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maks Hari Siswa
                  </label>
                  <input
                    type="number"
                    value={settingsForm.maxBorrowDaysStudent}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        maxBorrowDaysStudent: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maks Buku Siswa
                  </label>
                  <input
                    type="number"
                    value={settingsForm.maxBooksStudent}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        maxBooksStudent: parseInt(e.target.value) || 3,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-all"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="font-bold text-base text-slate-900">Manajemen Cadangan & Pemulihan Data</h2>
            <p className="text-xs text-slate-500">
              Amankan seluruh data katalog buku, riwayat sirkulasi, data anggota, dan buku tamu
            </p>
          </div>

          <div className="space-y-4">
            {/* Generate History Simulation */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Simulasi Riwayat Sirkulasi & Kunjungan (Januari – November 2026)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      Jumat Libur • Minggu Masuk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Seluruh buku ({books.length} judul) dan data anggota ({members.length} anggota) yang telah Anda input <strong>tetap aman dan tersimpan</strong>. Fitur ini membangkitkan transaksi peminjaman buku dan buku tamu kunjungan harian secara acak dan realistis mulai dari 1 Januari 2026 hingga saat ini dengan ketentuan:
                  </p>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li><strong>Setiap hari Jumat:</strong> Libur penuh (tepat 0 kunjungan, 0 peminjaman).</li>
                    <li><strong>Setiap hari Minggu:</strong> Tetap masuk sekolah (kunjungan dan peminjaman aktif normal).</li>
                    <li>Stok ketersediaan buku dihitung otomatis berdasarkan sirkulasi aktif.</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-200/70">
                <span className="text-[11px] text-emerald-800 font-medium">
                  {visitors.length} Kunjungan tercatat • {loans.length} Transaksi peminjaman
                </span>
                {onGenerateHistory && (
                  <button
                    onClick={onGenerateHistory}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Ulang Riwayat 2026</span>
                  </button>
                )}
              </div>
            </div>

            {/* Google Apps Script Cloud Database Banner */}
            <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <div>
                <span className="font-bold text-teal-900 block text-xs flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-teal-600" />
                  Cloud Database Google Sheets (Apps Script)
                </span>
                <span className="text-[11px] text-teal-700">
                  Sinkronkan seluruh data anggota, buku & stok, e-book PDF, dan presensi ke spreadsheet online Google Sheets
                </span>
              </div>
              {onOpenAppsScript && (
                <button
                  type="button"
                  onClick={onOpenAppsScript}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs shrink-0 ml-3"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Buka Apps Script</span>
                </button>
              )}
            </div>

            {/* Export JSON */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Cadangkan Semua Data (Export JSON)
                </span>
                <span className="text-[11px] text-slate-500">
                  Unduh berkas JSON berisi semua inventaris buku dan riwayat peminjaman
                </span>
              </div>
              <button
                onClick={exportAllData}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Cadangan</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Pulihkan dari Berkas JSON (Restore)
                </span>
                <span className="text-[11px] text-slate-500">
                  Unggah berkas cadangan JSON yang pernah diunduh sebelumnya
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to initial */}
            <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
              <div>
                <span className="font-bold block text-xs text-rose-900">
                  Reset ke Data Awal Contoh
                </span>
                <span className="text-[11px] text-rose-700">
                  Kembalikan ke 12 buku percontohan, anggota sekolah awal, dan sirkulasi sampel
                </span>
              </div>
              <button
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
