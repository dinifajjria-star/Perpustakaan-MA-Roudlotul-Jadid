import React, { useState } from 'react';
import { 
  UserCheck, 
  BookOpen, 
  Bookmark, 
  LogOut, 
  Library, 
  Search, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Sparkles,
  Info,
  History,
  Send,
  BookMarked
} from 'lucide-react';
import { Member, Book, VisitorLog, LibrarySettings, EBook } from '../../types/library';
import { EBookCollection } from '../EBooks/EBookCollection';
import { BookDetailModal } from '../Inventory/BookDetailModal';
import { HighlightMatch } from '../Common/HighlightMatch';

interface MemberPortalLayoutProps {
  currentMember: Member;
  settings: LibrarySettings;
  books: Book[];
  ebooks: EBook[];
  visitors: VisitorLog[];
  onAddVisitor: (log: VisitorLog) => void;
  onLogout: () => void;
  onIncrementEBookRead: (ebookId: string) => void;
}

type MemberTab = 'presensi' | 'katalog' | 'ebooks';

export const MemberPortalLayout: React.FC<MemberPortalLayoutProps> = ({
  currentMember,
  settings,
  books,
  ebooks,
  visitors,
  onAddVisitor,
  onLogout,
  onIncrementEBookRead,
}) => {
  const [activeTab, setActiveTab] = useState<MemberTab>('presensi');

  // Attendance Form State
  const [purpose, setPurpose] = useState<VisitorLog['purpose']>('Membaca di Tempat');
  const [customNote, setCustomNote] = useState('');
  const [isPresensiSuccess, setIsPresensiSuccess] = useState(false);

  // Physical Book Catalog Search & Filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [catalogAvailability, setCatalogAvailability] = useState<'all' | 'available'>('all');
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);

  // My attendance records
  const myVisitorLogs = visitors.filter(
    (v) =>
      v.memberId === currentMember.id ||
      v.nisn_nip === currentMember.nisn_nip ||
      v.name.toLowerCase() === currentMember.name.toLowerCase()
  );

  const handlePresensiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    const newLog: VisitorLog = {
      id: `vis-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      memberId: currentMember.id,
      nisn_nip: currentMember.nisn_nip,
      name: currentMember.name,
      role: currentMember.role,
      classOrDept: currentMember.classOrDept,
      purpose,
    };

    onAddVisitor(newLog);
    setIsPresensiSuccess(true);
    setTimeout(() => {
      setIsPresensiSuccess(false);
    }, 4500);
  };

  // Filtered physical books
  const filteredCatalog = books.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.rack.toLowerCase().includes(catalogSearch.toLowerCase());

    const matchCategory = catalogCategory === 'all' || b.category === catalogCategory;
    const matchAvail = catalogAvailability === 'all' || b.availableCopies > 0;

    return matchSearch && matchCategory && matchAvail;
  });

  const physicalCategories = Array.from(new Set(books.map((b) => b.category)));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-8 py-3 transition-all no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">
                  {settings.libraryName}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Portal Anggota
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{settings.schoolName}</p>
            </div>
          </div>

          {/* Member Profile Badge & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80">
              <div
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${
                  currentMember.avatarColor || 'bg-emerald-600'
                }`}
              >
                {currentMember.name.charAt(0)}
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-800 leading-tight truncate max-w-[150px]">
                  {currentMember.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentMember.role} • {currentMember.classOrDept}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
              title="Keluar dari Portal Anggota"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('presensi')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'presensi'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>1. Presensi Kehadiran</span>
            </button>

            <button
              onClick={() => setActiveTab('katalog')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'katalog'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>2. Katalog Buku Fisik ({books.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ebooks')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'ebooks'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>3. Koleksi & Baca E-Book ({ebooks.length})</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* ================= TAB 1: PRESENSI KEHADIRAN ================= */}
        {activeTab === 'presensi' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Presensi Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2.5 py-1 rounded-full inline-block mb-2">
                  Buku Tamu Digital
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Presensi Kunjungan Perpustakaan
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-lg leading-relaxed">
                  Selamat datang di Perpustakaan MA Roudlotul Jadid! Silakan isi formulir kehadiran sebelum memulai aktivitas membaca atau belajar.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15 text-center shrink-0">
                <span className="block text-2xl font-bold text-white">{myVisitorLogs.length}</span>
                <span className="text-[10px] text-emerald-200 uppercase font-semibold">Total Kunjungan Saya</span>
              </div>
            </div>

            {/* Presensi Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Formulir Catat Kehadiran Saya</span>
              </h3>

              {isPresensiSuccess && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Kehadiran Berhasil Dicatat!</p>
                    <p className="text-emerald-700 mt-0.5">
                      Terima kasih, data kunjungan Anda telah tersimpan di sistem perpustakaan. Selamat belajar dan membaca!
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handlePresensiSubmit} className="space-y-4 text-xs">
                {/* Auto-filled read-only member credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-0.5 text-[11px]">Nama Anggota</label>
                    <p className="font-bold text-slate-800">{currentMember.name}</p>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-0.5 text-[11px]">NISN / NIP</label>
                    <p className="font-mono font-medium text-slate-700">{currentMember.nisn_nip}</p>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-0.5 text-[11px]">Kelas / Jabatan</label>
                    <p className="font-semibold text-emerald-700">{currentMember.role} - {currentMember.classOrDept}</p>
                  </div>
                </div>

                {/* Purpose of visit */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Keperluan / Tujuan Kunjungan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'Membaca di Tempat',
                      'Meminjam / Mengembalikan',
                      'Mencari Referensi Tugas',
                      'Diskusi Kelompok',
                      'Lainnya',
                    ].map((opt) => {
                      const isSelected = purpose === opt;
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setPurpose(opt as any)}
                          className={`p-3 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Date Time Display */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Catat Kehadiran Saya Sekarang</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Riwayat Kehadiran Saya */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                <span>Riwayat Kehadiran Saya ({myVisitorLogs.length} Kali)</span>
              </h3>

              {myVisitorLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Belum ada catatan kehadiran sebelumnya. Isi formulir di atas untuk mencatat kehadiran pertama Anda!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Keperluan Kunjungan</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myVisitorLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{log.date}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{log.time} WIB</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{log.purpose}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Tercatat
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: KATALOG BUKU FISIK ================= */}
        {activeTab === 'katalog' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Katalog Inventaris Buku Perpustakaan
                </h2>
                <p className="text-xs text-slate-500">
                  Cari informasi buku, ketersediaan stok, nomor panggil (DDC), dan nomor rak fisik di perpustakaan.
                </p>
              </div>

              <div className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 self-start md:self-auto">
                Total Koleksi: {books.length} Judul Buku
              </div>
            </div>

            {/* Notice about borrowing physical books */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Petunjuk Peminjaman:</strong> Untuk meminjam buku fisik, catat <strong>Nomor Panggil (Call Number)</strong> atau lokasi rak buku, lalu bawa buku beserta kartu anggota Anda ke meja petugas perpustakaan.
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Ketik huruf judul buku, penulis, atau nomor rak..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
                  >
                    ×
                  </button>
                )}

                {/* Floating recommendations */}
                {catalogSearch.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 text-xs animate-fade-in max-h-56 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                      <span>Rekomendasi Buku ({filteredCatalog.length})</span>
                      <span className="text-[9px] font-normal text-slate-400">Klik untuk lihat detail</span>
                    </div>
                    {filteredCatalog.length > 0 ? (
                      filteredCatalog.slice(0, 5).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBookForDetail(b)}
                          className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
                        >
                          <div className="overflow-hidden pr-2">
                            <p className="font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                              <HighlightMatch text={b.title} query={catalogSearch} />
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              Penulis: <HighlightMatch text={b.author} query={catalogSearch} /> • Rak: {b.rack} • Panggil: {b.callNumber}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              b.availableCopies > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.availableCopies > 0 ? `${b.availableCopies} Eks` : 'Habis'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-[11px]">
                        Tidak ada buku yang cocok dengan huruf "{catalogSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Kategori</option>
                  {physicalCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={catalogAvailability}
                  onChange={(e) => setCatalogAvailability(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">Semua Status</option>
                  <option value="available">Tersedia di Rak Saja</option>
                </select>
              </div>
            </div>

            {/* Books Grid */}
            {filteredCatalog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada buku yang cocok</h3>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCatalog.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  return (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBookForDetail(book)}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between text-[10px] mb-2">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {book.callNumber}
                          </span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isAvailable ? `${book.availableCopies} Tersedia` : 'Habis Dipinjam'}
                          </span>
                        </div>

                        {/* Title & Author */}
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-1">
                          <HighlightMatch text={book.title} query={catalogSearch} />
                        </h4>
                        <p className="text-xs text-slate-500 mb-2 truncate">
                          <HighlightMatch text={book.author} query={catalogSearch} />
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                          {book.synopsis}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {book.rack}
                        </span>
                        <span className="text-emerald-600 font-semibold group-hover:underline">
                          Lihat Detail →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: KOLEKSI & BACA E-BOOK ================= */}
        {activeTab === 'ebooks' && (
          <EBookCollection
            ebooks={ebooks}
            isAdmin={false}
            onIncrementReadCount={onIncrementEBookRead}
          />
        )}
      </main>

      {/* Book Detail Modal if selected */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          loans={[]}
          onClose={() => setSelectedBookForDetail(null)}
          onQuickBorrow={() => setSelectedBookForDetail(null)}
          onPrintLabel={() => {}}
        />
      )}
    </div>
  );
};
