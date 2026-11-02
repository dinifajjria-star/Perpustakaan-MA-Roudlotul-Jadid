import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Library,
  ArrowRightLeft,
  LogOut,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { LibrarySettings, Book, Member, UserSession, AdminUser } from '../types/library';
import { HighlightMatch } from './Common/HighlightMatch';

interface NavbarProps {
  settings: LibrarySettings;
  overdueCount: number;
  books: Book[];
  members: Member[];
  admins?: AdminUser[];
  session?: UserSession | null;
  onLogout?: () => void;
  onOpenAdmins?: () => void;
  onOpenAppsScript?: () => void;
  onSelectAdmin?: (admin: AdminUser) => void;
  onOpenQuickBorrow: () => void;
  onOpenAddBook: () => void;
  onOpenAddMember: () => void;
  onOpenQuickReturn: () => void;
  onOpenVisitorModal: () => void;
  onSelectBook: (book: Book) => void;
  onSelectMember: (member: Member) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  overdueCount,
  books,
  members,
  admins = [],
  session,
  onLogout,
  onOpenAdmins,
  onOpenAppsScript,
  onSelectAdmin,
  onOpenQuickBorrow,
  onOpenAddBook,
  onOpenAddMember,
  onOpenQuickReturn,
  onOpenVisitorModal,
  onSelectBook,
  onSelectMember,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    books: Book[];
    members: Member[];
    admins: AdminUser[];
  }>({
    books: [],
    members: [],
    admins: [],
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchFilter, setActiveSearchFilter] = useState<'all' | 'books' | 'members' | 'admins'>('all');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now);
      setCurrentDateTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ books: [], members: [], admins: [] });
      setIsSearchOpen(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();

    // Matching Books
    const matchedBooks = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.callNumber.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    ).slice(0, 5);

    // Matching Members
    const matchedMembers = members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.nisn_nip.toLowerCase().includes(q) ||
        m.classOrDept.toLowerCase().includes(q)
    ).slice(0, 5);

    // Matching Admins
    const matchedAdmins = admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.username.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    ).slice(0, 4);

    setSearchResults({ books: matchedBooks, members: matchedMembers, admins: matchedAdmins });
    setIsSearchOpen(true);
  }, [searchQuery, books, members, admins]);

  const totalResultsCount =
    searchResults.books.length + searchResults.members.length + searchResults.admins.length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 lg:px-6 py-2.5 transition-all no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Brand identity */}
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
                Digital
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{settings.schoolName}</p>
          </div>
        </div>

        {/* Global Instant Search with Smart Recommendations */}
        <div className="relative flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik huruf untuk rekomendasi buku, anggota, atau admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 hover:bg-slate-100/90 focus:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[11px] font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Dropdown Recommendations Results */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-xs max-h-[460px] overflow-y-auto animate-fade-in">
              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-slate-100 overflow-x-auto text-[11px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSearchFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeSearchFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({totalResultsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSearchFilter('books')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeSearchFilter === 'books'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Buku ({searchResults.books.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSearchFilter('members')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeSearchFilter === 'members'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Anggota ({searchResults.members.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSearchFilter('admins')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeSearchFilter === 'admins'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Admin ({searchResults.admins.length})
                </button>
              </div>

              {totalResultsCount === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">Tidak ada rekomendasi yang cocok</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Huruf "{searchQuery}" tidak ditemukan pada daftar buku, anggota, maupun admin yang tersimpan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Rekomendasi Buku */}
                  {(activeSearchFilter === 'all' || activeSearchFilter === 'books') &&
                    searchResults.books.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            Rekomendasi Buku ({searchResults.books.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.books.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => {
                                onSelectBook(b);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl flex items-center justify-between group transition-colors border border-transparent hover:border-emerald-200"
                            >
                              <div className="overflow-hidden pr-2 flex items-center gap-2.5">
                                <div className="w-8 h-10 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 group-hover:border-emerald-300">
                                  {b.coverUrl ? (
                                    <img src={b.coverUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700">
                                    <HighlightMatch text={b.title} query={searchQuery} />
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    Penulis: <HighlightMatch text={b.author} query={searchQuery} /> • Rak: {b.rack}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    Kode: <HighlightMatch text={b.code} query={searchQuery} /> • Panggil: {b.callNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    b.availableCopies > 0
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {b.availableCopies > 0
                                    ? `Sisa ${b.availableCopies}/${b.totalCopies}`
                                    : 'Dipinjam Semua'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Rekomendasi Anggota */}
                  {(activeSearchFilter === 'all' || activeSearchFilter === 'members') &&
                    searchResults.members.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            Rekomendasi Anggota ({searchResults.members.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.members.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                onSelectMember(m);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2 hover:bg-blue-50/70 rounded-xl flex items-center justify-between group transition-colors border border-transparent hover:border-blue-200"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                                <div
                                  className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                    m.avatarColor || 'bg-blue-600'
                                  }`}
                                >
                                  {m.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-slate-800 truncate group-hover:text-blue-700">
                                    <HighlightMatch text={m.name} query={searchQuery} />
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {m.role} • {m.classOrDept} • NISN/NIP:{' '}
                                    <HighlightMatch text={m.nisn_nip} query={searchQuery} />
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                  m.role === 'Siswa'
                                    ? 'bg-blue-100 text-blue-800'
                                    : m.role === 'Guru'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {m.role}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Rekomendasi Admin & Petugas */}
                  {(activeSearchFilter === 'all' || activeSearchFilter === 'admins') &&
                    searchResults.admins.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Rekomendasi Admin & Petugas ({searchResults.admins.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.admins.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => {
                                if (onSelectAdmin) {
                                  onSelectAdmin(a);
                                } else if (onOpenAdmins) {
                                  onOpenAdmins();
                                }
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl flex items-center justify-between group transition-colors border border-transparent hover:border-emerald-200"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                                <div
                                  className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                    a.avatarColor || 'bg-emerald-600'
                                  }`}
                                >
                                  {a.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700">
                                    <HighlightMatch text={a.name} query={searchQuery} />
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    @<HighlightMatch text={a.username} query={searchQuery} />
                                    {a.email ? ` • ${a.email}` : ''}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                                {a.role}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right action bar & status */}
        <div className="flex items-center gap-2.5">
          {/* Overdue alert badge button */}
          {overdueCount > 0 && (
            <button
              onClick={onOpenQuickReturn}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors animate-pulse"
              title="Klik untuk membuka pengembalian buku terlambat"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{overdueCount} Terlambat</span>
            </button>
          )}

          {/* Quick Presensi Tamu */}
          <button
            onClick={onOpenVisitorModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Presensi Tamu</span>
          </button>

          {/* Quick Peminjaman Transaksi */}
          <button
            onClick={onOpenQuickBorrow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Pinjam Buku</span>
          </button>

          {/* Quick Tambah Buku */}
          <button
            onClick={onOpenAddBook}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors"
            title="Tambah Koleksi Buku Baru"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">+ Buku</span>
          </button>

          {/* Quick Tambah Anggota */}
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors"
            title="Daftarkan Siswa/Guru/Staf Baru"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">+ Anggota</span>
          </button>

          {/* LocalStorage Live Status Badge */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 select-none shadow-2xs"
            title="Data aplikasi perpustakaan tersimpan otomatis & persisten di LocalStorage browser (tidak hilang saat refresh)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LocalStorage: Aktif</span>
          </div>

          {/* Apps Script Cloud Status Button */}
          {onOpenAppsScript && (
            <button
              onClick={onOpenAppsScript}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/80 text-[11px] font-semibold text-teal-800 transition-colors shadow-2xs cursor-pointer"
              title="Integrasi Google Apps Script & Google Sheets Cloud Backend"
            >
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              <span>Apps Script</span>
            </button>
          )}

          {/* Date Clock */}
          <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-slate-500 pl-2 border-l border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentDateTime}</span>
          </div>

          {/* User Session Profile & Logout */}
          {session && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={onOpenAdmins}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors border border-emerald-200/60"
                title="Klik untuk Kelola Akun Admin & Petugas"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[115px]">{session.adminName || 'Admin'}</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Keluar / Ganti Akun"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

