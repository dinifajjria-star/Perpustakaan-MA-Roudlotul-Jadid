import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Save, 
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types/library';
import { HighlightMatch } from '../Common/HighlightMatch';
import { suggestNewAdminNames } from '../../utils/recommendations';

interface AdminFormModalProps {
  initialAdmin?: AdminUser | null;
  existingAdmins: AdminUser[];
  onSave: (admin: AdminUser) => void;
  onClose: () => void;
}

const AVATAR_COLORS = [
  { name: 'Zamrud', class: 'bg-emerald-600' },
  { name: 'Biru', class: 'bg-blue-600' },
  { name: 'Ungu', class: 'bg-purple-600' },
  { name: 'Indigo', class: 'bg-indigo-600' },
  { name: 'Amber', class: 'bg-amber-600' },
  { name: 'Mawar', class: 'bg-rose-600' },
  { name: 'Teal', class: 'bg-teal-600' },
  { name: 'Slate', class: 'bg-slate-700' },
];

export const AdminFormModal: React.FC<AdminFormModalProps> = ({
  initialAdmin,
  existingAdmins,
  onSave,
  onClose,
}) => {
  const isEditing = !!initialAdmin;

  const [username, setUsername] = useState(initialAdmin?.username || '');
  const [name, setName] = useState(initialAdmin?.name || '');
  const [role, setRole] = useState<AdminRole>(initialAdmin?.role || 'Pustakawan');
  const [password, setPassword] = useState(initialAdmin?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(initialAdmin?.password || '');
  const [phone, setPhone] = useState(initialAdmin?.phone || '');
  const [email, setEmail] = useState(initialAdmin?.email || '');
  const [avatarColor, setAvatarColor] = useState(initialAdmin?.avatarColor || AVATAR_COLORS[0].class);

  const [showPassword, setShowPassword] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameSuggestions = suggestNewAdminNames(name, existingAdmins, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError('Username wajib diisi (hanya huruf kecil, angka, dan garis bawah).');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username minimal 3 karakter.');
      return;
    }

    // Check unique username
    const isDuplicate = existingAdmins.some(
      (a) => a.username.toLowerCase() === cleanUsername && a.id !== initialAdmin?.id
    );
    if (isDuplicate) {
      setError(`Username "${cleanUsername}" sudah digunakan oleh admin lain. Silakan pilih username berbeda.`);
      return;
    }

    if (!cleanName) {
      setError('Nama lengkap admin / petugas wajib diisi.');
      return;
    }

    if (!cleanPassword) {
      setError('Password wajib diisi.');
      return;
    }

    if (cleanPassword.length < 4) {
      setError('Password minimal 4 karakter demi keamanan akun.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    const adminData: AdminUser = {
      id: initialAdmin?.id || `adm-${Date.now()}`,
      username: cleanUsername,
      name: cleanName,
      password: cleanPassword,
      role,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      avatarColor,
      addedDate: initialAdmin?.addedDate || new Date().toISOString().split('T')[0],
      isDefault: initialAdmin?.isDefault || false,
    };

    onSave(adminData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {isEditing ? 'Edit Data Akun Admin' : 'Tambah Admin & Petugas Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Akses penuh sistem perpustakaan MA Roudlotul Jadid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Username Login <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                placeholder="misal: fajar, nuraini, admin2"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Digunakan saat login ke sistem (huruf kecil & angka tanpa spasi).
            </p>
          </div>

          {/* Nama Lengkap with Live Recommendations */}
          <div className="relative">
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Nama Lengkap Petugas / Admin <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-purple-600 font-normal">Ketik huruf untuk rekomendasi</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onFocus={() => setShowNameSuggestions(true)}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowNameSuggestions(true);
                }}
                required
                placeholder="Contoh: Siti Rahmawati, S.I.Pust."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-800 font-medium"
              />
            </div>

            {/* Live Name Suggestions Dropdown */}
            {showNameSuggestions && nameSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-white border border-purple-300 rounded-2xl shadow-xl p-1.5 space-y-1 z-30 animate-fadeIn">
                <div className="px-2.5 py-1 text-[10px] font-bold text-purple-800 uppercase tracking-wider flex items-center justify-between border-b border-purple-100 bg-purple-50/80 rounded-lg mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Rekomendasi Nama Admin ({nameSuggestions.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNameSuggestions(false)}
                    className="text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    Tutup [✕]
                  </button>
                </div>
                {nameSuggestions.map((sug, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setName(sug.name);
                      if (!isEditing || !username) {
                        setUsername(sug.username);
                      }
                      setRole(sug.role);
                      if (sug.phone && !phone) {
                        setPhone(sug.phone);
                      }
                      setShowNameSuggestions(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-purple-50 rounded-xl text-slate-800 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900 group-hover:text-purple-800">
                        <HighlightMatch text={sug.name} query={name} />
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        @{sug.username}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">
                      {sug.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role / Jabatan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Jabatan / Tingkat Akses <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Super Admin', 'Pustakawan', 'Staf Admin'] as AdminRole[]).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="block text-xs">{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 4 karakter"
                  className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ulangi Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi password"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Kontak: No. Telepon & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor HP / WhatsApp (Opsional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Sekolah / Resmi (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@maroudlotuljadid.sch.id"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Warna Avatar */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Warna Ikon Profil
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((col) => (
                <button
                  type="button"
                  key={col.class}
                  onClick={() => setAvatarColor(col.class)}
                  className={`w-7 h-7 rounded-full ${col.class} transition-transform ${
                    avatarColor === col.class ? 'ring-2 ring-offset-2 ring-purple-600 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
