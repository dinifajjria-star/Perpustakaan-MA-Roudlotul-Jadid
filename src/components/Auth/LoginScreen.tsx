import React, { useState } from 'react';
import { 
  Library, 
  Lock, 
  User, 
  KeyRound, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { Member, LibrarySettings, UserSession, AdminUser } from '../../types/library';
import { loadAdmins } from '../../utils/storage';
import { HighlightMatch } from '../Common/HighlightMatch';

interface LoginScreenProps {
  settings: LibrarySettings;
  members: Member[];
  admins?: AdminUser[];
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  members,
  admins,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');

  // Load admins list
  const adminsList = admins && admins.length > 0 ? admins : loadAdmins();

  // Member Login State
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [showMemberRecs, setShowMemberRecs] = useState(false);

  // Admin Login State
  const [adminUsername, setAdminUsername] = useState(adminsList[0]?.username || 'admin');
  const [adminPassword, setAdminPassword] = useState(adminsList[0]?.password || 'admin');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showAdminRecs, setShowAdminRecs] = useState(false);

  // Filter recommendations when typing letters
  const matchedMembers = memberIdentifier.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(memberIdentifier.toLowerCase()) ||
          m.nisn_nip.toLowerCase().includes(memberIdentifier.toLowerCase()) ||
          m.classOrDept.toLowerCase().includes(memberIdentifier.toLowerCase())
      ).slice(0, 5)
    : [];

  const matchedAdmins = adminUsername.trim()
    ? adminsList.filter(
        (a) =>
          a.username.toLowerCase().includes(adminUsername.toLowerCase()) ||
          a.name.toLowerCase().includes(adminUsername.toLowerCase()) ||
          a.role.toLowerCase().includes(adminUsername.toLowerCase())
      ).slice(0, 5)
    : [];

  // Handle Member Login
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);

    const q = memberIdentifier.trim().toLowerCase();
    if (!q) {
      setMemberError('Silakan masukkan NISN, NIP, atau ID Anggota Anda.');
      return;
    }

    // Match by nisn_nip, id, or exact name
    const found = members.find(
      (m) =>
        m.nisn_nip.toLowerCase() === q ||
        m.id.toLowerCase() === q ||
        m.name.toLowerCase() === q
    );

    if (!found) {
      setMemberError('Data anggota tidak ditemukan. Pastikan NISN atau NIP sudah terdaftar di perpustakaan.');
      return;
    }

    if (found.status === 'Nonaktif' || found.status === 'Ditangguhkan') {
      setMemberError(`Status keanggotaan Anda saat ini ${found.status}. Silakan hubungi petugas perpustakaan.`);
      return;
    }

    onLoginSuccess({
      role: 'member',
      member: found,
      loginTime: new Date().toISOString(),
    });
  };

  // Handle Quick Member Select
  const handleQuickMemberLogin = (member: Member) => {
    onLoginSuccess({
      role: 'member',
      member,
      loginTime: new Date().toISOString(),
    });
  };

  // Handle Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const user = adminUsername.trim().toLowerCase();
    const pass = adminPassword.trim();

    // Check against registered admins
    const foundAdmin = adminsList.find(
      (a) => a.username.toLowerCase() === user && a.password === pass
    );

    if (foundAdmin) {
      onLoginSuccess({
        role: 'admin',
        adminUsername: foundAdmin.username,
        adminName: foundAdmin.name,
        adminRole: foundAdmin.role,
        adminId: foundAdmin.id,
        loginTime: new Date().toISOString(),
      });
      return;
    }

    // Fallback for default hardcoded credentials if somehow list doesn't match
    if ((user === 'admin' || user === 'pustakawan') && (pass === 'admin' || pass === 'admin123' || pass === '123456')) {
      onLoginSuccess({
        role: 'admin',
        adminUsername: user,
        adminName: settings.headLibrarian || 'Petugas Perpustakaan',
        adminRole: 'Super Admin',
        loginTime: new Date().toISOString(),
      });
      return;
    }

    setAdminError('Username atau password admin salah. Silakan periksa kembali akun yang Anda masukkan.');
  };

  // Quick Demo Admin Login
  const handleQuickAdminLogin = (targetAdmin?: AdminUser) => {
    const adminToLogin = targetAdmin || adminsList[0];
    onLoginSuccess({
      role: 'admin',
      adminUsername: adminToLogin ? adminToLogin.username : 'admin',
      adminName: adminToLogin ? adminToLogin.name : (settings.headLibrarian || 'Petugas Perpustakaan'),
      adminRole: adminToLogin ? adminToLogin.role : 'Super Admin',
      adminId: adminToLogin ? adminToLogin.id : 'adm-1',
      loginTime: new Date().toISOString(),
    });
  };

  const sampleMembers = members.filter((m) => m.status === 'Aktif').slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10 animate-fadeIn">
        {/* Institutional Header */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-3 text-emerald-300 shadow-inner">
            <Library className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black tracking-tight">{settings.libraryName}</h1>
          <p className="text-xs text-emerald-200/80 font-medium mt-0.5">{settings.schoolName}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] text-emerald-200 mt-3 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Sistem Otomasi & E-Book Terpadu</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('member')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'member'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Portal Anggota</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin / Petugas</span>
          </button>
        </div>

        {/* Tab 1: Member Login */}
        {activeTab === 'member' && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-800">Masuk sebagai Siswa / Guru</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Akses formulir presensi perpustakaan, cek katalog buku fisik, dan baca e-book.
              </p>
            </div>

            {memberError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{memberError}</span>
              </div>
            )}

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk (NISN untuk Siswa / NIP untuk Guru) atau Nama
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberIdentifier}
                    onChange={(e) => {
                      setMemberIdentifier(e.target.value);
                      setShowMemberRecs(true);
                    }}
                    onFocus={() => setShowMemberRecs(true)}
                    placeholder="Ketik huruf nama atau nomor NISN..."
                    className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
                    autoFocus
                  />
                  {memberIdentifier && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberIdentifier('');
                        setShowMemberRecs(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Live Member Recommendations Dropdown */}
                {showMemberRecs && memberIdentifier.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-fade-in max-h-52 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                      <span>Rekomendasi Anggota ({matchedMembers.length})</span>
                      <span className="text-[9px] font-normal text-slate-400">Klik untuk pilih</span>
                    </div>
                    {matchedMembers.length > 0 ? (
                      matchedMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMemberIdentifier(m.nisn_nip || m.name);
                            setShowMemberRecs(false);
                          }}
                          className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
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
                              <p className="font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                                <HighlightMatch text={m.name} query={memberIdentifier} />
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {m.role} • <HighlightMatch text={m.classOrDept} query={memberIdentifier} /> • NISN/NIP:{' '}
                                <HighlightMatch text={m.nisn_nip} query={memberIdentifier} />
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            Pilih
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-[11px]">
                        Tidak ditemukan anggota dengan huruf "{memberIdentifier}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Masuk ke Portal Anggota</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Shortcut for Evaluator */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Atau Pilih Cepat Akun Demo Siswa / Guru:
              </p>
              <div className="space-y-1.5">
                {sampleMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickMemberLogin(m)}
                    className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${m.avatarColor || 'bg-emerald-600'}`}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-emerald-700 leading-tight">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {m.role} • {m.classOrDept} • {m.nisn_nip}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Pilih →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Login */}
        {activeTab === 'admin' && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-800">Masuk sebagai Admin / Petugas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola sirkulasi buku, inventaris, anggota, laporan, presensi, dan koleksi e-book.
              </p>
            </div>

            {adminError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Petugas / Nama Admin
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminUsername(e.target.value);
                      setShowAdminRecs(true);
                    }}
                    onFocus={() => setShowAdminRecs(true)}
                    required
                    className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium"
                    placeholder="Ketik huruf nama atau username admin..."
                  />
                  {adminUsername && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminUsername('');
                        setShowAdminRecs(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Live Admin Recommendations Dropdown */}
                {showAdminRecs && adminUsername.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-fade-in max-h-52 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                      <span>Rekomendasi Akun Admin ({matchedAdmins.length})</span>
                      <span className="text-[9px] font-normal text-slate-400">Klik untuk isi otomatis</span>
                    </div>
                    {matchedAdmins.length > 0 ? (
                      matchedAdmins.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setAdminUsername(a.username);
                            setAdminPassword(a.password);
                            setShowAdminRecs(false);
                          }}
                          className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <div
                              className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                a.avatarColor || 'bg-emerald-600'
                              }`}
                            >
                              {a.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                                <HighlightMatch text={a.name} query={adminUsername} />
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                @<HighlightMatch text={a.username} query={adminUsername} />
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                            {a.role}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-[11px]">
                        Tidak ada akun admin yang cocok dengan "{adminUsername}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk sebagai Admin</span>
              </button>
            </form>

            {/* Quick 1-Click Login for Registered Admins */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Akun Admin ({adminsList.length})
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">1-Klik Masuk</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {adminsList.map((adm) => (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => handleQuickAdminLogin(adm)}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-colors flex items-center justify-between group"
                    title={`Masuk sebagai ${adm.name} (@${adm.username})`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${adm.avatarColor || 'bg-purple-600'}`}>
                        {adm.name.charAt(0)}
                      </div>
                      <div className="truncate text-xs">
                        <span className="font-bold text-slate-800 group-hover:text-emerald-800 truncate block">
                          {adm.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          @{adm.username} • {adm.password}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 shrink-0">
                      {adm.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-6 text-center text-xs text-slate-400 relative z-10">
        <p>© {new Date().getFullYear()} {settings.libraryName} • {settings.schoolName}</p>
        <p className="text-[10px] text-slate-500 mt-1">Denda Keterlambatan: Rp {settings.finePerDay.toLocaleString('id-ID')} / hari</p>
      </footer>
    </div>
  );
};
