import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  UserCheck, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  Square, 
  AlertCircle,
  KeyRound,
  Sparkles,
  Lock
} from 'lucide-react';
import { AdminUser, AdminRole, UserSession } from '../../types/library';
import { AdminFormModal } from './AdminFormModal';
import { HighlightMatch } from '../Common/HighlightMatch';

interface AdminManagementViewProps {
  admins: AdminUser[];
  currentSession?: UserSession | null;
  onAddAdmin: (admin: AdminUser) => void;
  onUpdateAdmin: (admin: AdminUser) => void;
  onDeleteAdmin: (adminId: string) => void;
  onDeleteAdminsBulk: (adminIds: string[]) => void;
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  admins,
  currentSession,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
  onDeleteAdminsBulk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Single Delete state
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Filtered Admins
  const filteredAdmins = admins.filter((adm) => {
    const matchQuery =
      adm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adm.email && adm.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (adm.phone && adm.phone.includes(searchQuery));

    const matchRole = selectedRole === 'all' || adm.role === selectedRole;
    return matchQuery && matchRole;
  });

  // Metrics
  const totalAdmins = admins.length;
  const superAdminCount = admins.filter((a) => a.role === 'Super Admin').length;
  const pustakawanCount = admins.filter((a) => a.role === 'Pustakawan').length;
  const stafAdminCount = admins.filter((a) => a.role === 'Staf Admin').length;

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredAdmins.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAdmins.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmSingleDelete = () => {
    if (!adminToDelete) return;
    
    // Safety check: Cannot delete last remaining admin
    if (admins.length <= 1) {
      alert('Tidak dapat menghapus admin terakhir. Sistem membutuhkan minimal 1 akun admin aktif.');
      setAdminToDelete(null);
      return;
    }

    // Safety check: Cannot delete currently logged in account
    if (currentSession?.adminUsername && adminToDelete.username.toLowerCase() === currentSession.adminUsername.toLowerCase()) {
      alert('Anda tidak dapat menghapus akun admin yang sedang Anda gunakan untuk login saat ini.');
      setAdminToDelete(null);
      return;
    }

    onDeleteAdmin(adminToDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== adminToDelete.id));
    setAdminToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    // Filter out current logged in user and keep at least 1 admin
    const idsToDelete = selectedIds.filter((id) => {
      const target = admins.find((a) => a.id === id);
      if (!target) return false;
      if (currentSession?.adminUsername && target.username.toLowerCase() === currentSession.adminUsername.toLowerCase()) {
        return false;
      }
      return true;
    });

    if (idsToDelete.length === 0) {
      alert('Akun yang dipilih tidak dapat dihapus karena merupakan akun yang sedang aktif digunakan.');
      setIsBulkDeleteModalOpen(false);
      return;
    }

    if (admins.length - idsToDelete.length < 1) {
      alert('Penghapusan dibatalkan karena sistem harus mempertahankan minimal 1 akun admin aktif.');
      setIsBulkDeleteModalOpen(false);
      return;
    }

    onDeleteAdminsBulk(idsToDelete);
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const getRoleBadgeStyle = (role: AdminRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Pustakawan':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Staf Admin':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-purple-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Otoritas & Akses Sistem MA Roudlotul Jadid</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Manajemen Akun Admin & Petugas
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 mt-1 max-w-2xl leading-relaxed">
              Tambahkan, perbarui, dan hapus akun petugas perpustakaan yang memiliki wewenang untuk mengelola katalog buku, anggota, sirkulasi, dan e-book digital.
            </p>
          </div>

          {/* Quick Metrics & Add Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-white/10 backdrop-blur px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-lg sm:text-xl font-bold text-white">{totalAdmins}</span>
              <span className="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Total Admin</span>
            </div>
            <div className="bg-white/10 backdrop-blur px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-lg sm:text-xl font-bold text-emerald-300">{superAdminCount}</span>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">Super Admin</span>
            </div>
            <div className="bg-white/10 backdrop-blur px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-lg sm:text-xl font-bold text-blue-300">{pustakawanCount}</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Pustakawan</span>
            </div>

            <button
              onClick={() => {
                setEditingAdmin(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah Admin Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search with Live Recommendations */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik huruf nama admin, username (@...), atau email..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
            >
              ×
            </button>
          )}

          {/* Admin Recommendations Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 text-xs animate-fade-in max-h-56 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                <span>Rekomendasi Akun Admin ({filteredAdmins.length})</span>
                <span className="text-[9px] font-normal text-slate-400">Klik untuk pilih</span>
              </div>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.slice(0, 5).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSearchQuery(a.name)}
                    className="w-full text-left p-2 hover:bg-purple-50 rounded-xl flex items-center justify-between transition-colors border border-transparent hover:border-purple-200 group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <div
                        className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          a.avatarColor || 'bg-purple-600'
                        }`}
                      >
                        {a.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 group-hover:text-purple-700 truncate">
                          <HighlightMatch text={a.name} query={searchQuery} highlightClassName="bg-purple-100 text-purple-900 font-bold px-0.5 rounded" />
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          @<HighlightMatch text={a.username} query={searchQuery} highlightClassName="bg-purple-100 text-purple-900 font-bold px-0.5 rounded" />
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full shrink-0 border border-purple-200">
                      {a.role}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-slate-400 text-[11px]">
                  Tidak ada akun admin yang cocok dengan huruf "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-purple-500 font-medium"
          >
            <option value="all">Semua Role ({admins.length})</option>
            <option value="Super Admin">Super Admin ({superAdminCount})</option>
            <option value="Pustakawan">Pustakawan ({pustakawanCount})</option>
            <option value="Staf Admin">Staf Admin ({stafAdminCount})</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            {selectedIds.length === filteredAdmins.length && filteredAdmins.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-purple-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Pilih Semua ({filteredAdmins.length})</span>
          </button>
          {selectedIds.length > 0 && (
            <span className="text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {selectedIds.length} akun terpilih
            </span>
          )}
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus {selectedIds.length} Akun Terpilih</span>
          </button>
        )}
      </div>

      {/* Admin Cards Grid */}
      {filteredAdmins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada admin yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? `Tidak ditemukan admin dengan kata kunci "${searchQuery}".` : 'Belum ada data admin terdaftar.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredAdmins.map((admin) => {
            const isSelected = selectedIds.includes(admin.id);
            const isCurrentLoggedIn =
              currentSession?.adminUsername &&
              admin.username.toLowerCase() === currentSession.adminUsername.toLowerCase();

            return (
              <div
                key={admin.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden group ${
                  isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200/90 shadow-xs'
                }`}
              >
                {/* Card Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-md ${
                          admin.avatarColor || 'bg-purple-600'
                        }`}
                      >
                        {admin.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">
                            <HighlightMatch text={admin.name} query={searchQuery} highlightClassName="bg-purple-100 text-purple-900 font-bold px-0.5 rounded" />
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            @<HighlightMatch text={admin.username} query={searchQuery} highlightClassName="bg-purple-100 text-purple-900 font-bold px-0.5 rounded" />
                          </span>
                          {isCurrentLoggedIn && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selection Checkbox */}
                    <button
                      onClick={() => handleToggleSelect(admin.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-purple-600 transition-colors"
                      title="Pilih akun"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${getRoleBadgeStyle(
                        admin.role
                      )}`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{admin.role}</span>
                    </span>
                  </div>

                  {/* Info Meta */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-400">Password:</span>
                      <span className="font-mono font-medium text-slate-700">••••••••</span>
                    </div>

                    {admin.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                    )}

                    {admin.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{admin.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Terdaftar sejak: {admin.addedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setEditingAdmin(admin);
                      setIsFormOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit / Ganti Password</span>
                  </button>

                  <button
                    onClick={() => setAdminToDelete(admin)}
                    disabled={isCurrentLoggedIn || admins.length <= 1}
                    className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                      isCurrentLoggedIn || admins.length <= 1
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-300 text-rose-600'
                    }`}
                    title={
                      isCurrentLoggedIn
                        ? 'Tidak dapat menghapus akun yang sedang aktif digunakan'
                        : admins.length <= 1
                        ? 'Tidak dapat menghapus admin terakhir'
                        : 'Hapus akun admin ini'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Admin Modal */}
      {isFormOpen && (
        <AdminFormModal
          initialAdmin={editingAdmin}
          existingAdmins={admins}
          onSave={(savedAdmin) => {
            if (editingAdmin) {
              onUpdateAdmin(savedAdmin);
            } else {
              onAddAdmin(savedAdmin);
            }
            setIsFormOpen(false);
            setEditingAdmin(null);
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAdmin(null);
          }}
        />
      )}

      {/* Single Delete Confirmation Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-800">
              Konfirmasi Hapus Akun Admin
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun admin <span className="font-bold text-slate-900">"{adminToDelete.name}"</span> (@{adminToDelete.username})? Pengguna ini tidak akan dapat login lagi ke sistem perpustakaan.
            </p>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setAdminToDelete(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Batalkan
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                Ya, Hapus Akun Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-800">
              Konfirmasi Hapus Massal Akun Admin
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Anda akan menghapus <span className="font-bold text-rose-600">{selectedIds.length} akun admin</span> yang dipilih. Akun yang sedang aktif digunakan saat ini akan otomatis diabaikan demi keamanan sistem.
            </p>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Batalkan
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                Ya, Hapus {selectedIds.length} Akun Terpilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
