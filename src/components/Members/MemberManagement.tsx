import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Printer,
  Edit3,
  Trash2,
  BookOpen,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { Member, MemberRole, MemberStatus, LoanTransaction, LibrarySettings } from '../../types/library';
import { formatDateIndo } from '../../utils/formatters';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../../utils/datePeriods';
import { PeriodFilterBar } from '../Common/PeriodFilterBar';
import { downloadMemberCsvTemplate } from '../../utils/csvTemplates';
import { HighlightMatch } from '../Common/HighlightMatch';

interface MemberManagementProps {
  members: Member[];
  loans: LoanTransaction[];
  settings: LibrarySettings;
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onDeleteMembersBulk?: (memberIds: string[]) => void;
  onPrintMemberCard: (member: Member) => void;
  onSyncHistory?: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  loans,
  settings,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onDeleteMembersBulk,
  onPrintMemberCard,
  onSyncHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | MemberRole>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [memberToDeleteSingle, setMemberToDeleteSingle] = useState<Member | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nisn_nip: '',
    name: '',
    role: 'Siswa' as MemberRole,
    classOrDept: 'X MIPA 1',
    phone: '',
    email: '',
    gender: 'L' as 'L' | 'P',
    status: 'Aktif' as MemberStatus,
  });

  // Calculate active loans per member
  const getActiveLoans = (memberId: string) => {
    return loans.filter(
      (l) => l.memberId === memberId && (l.status === 'Dipinjam' || l.status === 'Terlambat')
    );
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      m.name.toLowerCase().includes(q) ||
      m.nisn_nip.toLowerCase().includes(q) ||
      m.classOrDept.toLowerCase().includes(q);

    const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
    const inPeriod = selectedPeriod === 'all' || isDateInPeriod(m.joinDate, selectedPeriod);
    return matchQuery && matchRole && inPeriod;
  });

  // Selection Helpers for Bulk Actions
  const isAllFilteredSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedMemberIds.has(m.id));

  const toggleSelectAllMembers = () => {
    if (isAllFilteredSelected) {
      const next = new Set(selectedMemberIds);
      filteredMembers.forEach((m) => next.delete(m.id));
      setSelectedMemberIds(next);
    } else {
      const next = new Set(selectedMemberIds);
      filteredMembers.forEach((m) => next.add(m.id));
      setSelectedMemberIds(next);
    }
  };

  const selectAllMembersCatalog = () => {
    setSelectedMemberIds(new Set(members.map((m) => m.id)));
  };

  const clearAllMemberSelection = () => {
    setSelectedMemberIds(new Set());
  };

  const toggleSelectMember = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemberIds(next);
  };

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      nisn_nip: '',
      name: '',
      role: 'Siswa',
      classOrDept: 'X-1',
      phone: '',
      email: '',
      gender: 'L',
      status: 'Aktif',
    });
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      nisn_nip: member.nisn_nip,
      name: member.name,
      role: member.role,
      classOrDept: member.classOrDept,
      phone: member.phone,
      email: member.email || '',
      gender: member.gender,
      status: member.status,
    });
    setIsModalOpen(true);
  };

  // Submit form
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nisn_nip.trim()) return;

    const avatarColors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-indigo-600',
      'bg-amber-600',
      'bg-purple-600',
      'bg-teal-600',
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        ...formData,
      });
    } else {
      const newMember: Member = {
        id: `mem-${Date.now()}`,
        ...formData,
        joinDate: new Date().toISOString().split('T')[0],
        avatarColor: randomColor,
      };
      onAddMember(newMember);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Data Anggota Perpustakaan
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {members.length} Anggota
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold" title="Data anggota tersimpan permanen di LocalStorage browser (tidak hilang saat refresh)">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LocalStorage Aktif</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen data siswa, dewan guru, dan cetak kartu anggota perpustakaan resmi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Tombol Hapus Masal Anggota */}
          <button
            type="button"
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
              selectedMemberIds.size > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-400'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
            }`}
            title="Hapus data anggota secara massal / berkelompok"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {selectedMemberIds.size > 0
                ? `Hapus Masal (${selectedMemberIds.size} Anggota)`
                : 'Hapus Masal Anggota'}
            </span>
          </button>

          <button
            type="button"
            onClick={downloadMemberCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors"
            title="Unduh file template Excel / CSV data anggota perpustakaan"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Template CSV</span>
          </button>

          {onSyncHistory && (
            <button
              type="button"
              onClick={onSyncHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs active:scale-95"
              title="Perbarui daftar kunjungan & siklus peminjaman 2026 berdasarkan seluruh anggota ini"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan Siklus & Kunjungan 2026</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Rekapitulasi Periode Pendaftaran Anggota */}
      <PeriodFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={(p) => setSelectedPeriod(p)}
        title="Rekapitulasi Anggota Berdasarkan Waktu Pendaftaran:"
        summaryText={`${filteredMembers.length} Anggota (${filteredMembers.filter((m) => m.role === 'Siswa').length} Siswa, ${filteredMembers.filter((m) => m.role === 'Guru' || m.role === 'Staf').length} Guru/Staf)`}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ketik huruf nama siswa/guru, NISN/NIP, atau kelas..."
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

          {/* Member Recommendations Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 text-xs animate-fade-in max-h-56 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                <span>Rekomendasi Anggota ({filteredMembers.length})</span>
                <span className="text-[9px] font-normal text-slate-400">Klik untuk pilih</span>
              </div>
              {filteredMembers.length > 0 ? (
                filteredMembers.slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSearchQuery(m.name);
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
                          <HighlightMatch text={m.name} query={searchQuery} />
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {m.role} • <HighlightMatch text={m.classOrDept} query={searchQuery} /> • NISN/NIP:{' '}
                          <HighlightMatch text={m.nisn_nip} query={searchQuery} />
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      {m.role}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-slate-400 text-[11px]">
                  Tidak ada anggota yang cocok dengan huruf "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'Siswa', 'Guru', 'Staf'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL' ? 'Semua' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Toolbar when members are selected */}
      {selectedMemberIds.size > 0 && (
        <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
              {selectedMemberIds.size} Anggota Dipilih
            </span>
            <span className="text-xs text-slate-500">
              dari total {filteredMembers.length} anggota yang tampil
            </span>

            {members.length > filteredMembers.length && (
              <button
                type="button"
                onClick={selectAllMembersCatalog}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline"
              >
                Pilih Seluruh Anggota ({members.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-all"
              title="Hapus data anggota yang dipilih secara bersamaan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedMemberIds.size})</span>
            </button>
            <button
              type="button"
              onClick={clearAllMemberSelection}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 transition-colors"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAllMembers}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    title="Pilih semua anggota"
                  />
                </th>
                <th className="py-3 px-4">Nama & Identitas</th>
                <th className="py-3 px-3">Tipe & Kelas</th>
                <th className="py-3 px-3">Kontak</th>
                <th className="py-3 px-3 text-center">Buku Dipinjam</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Kartu & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const activeLoansCount = getActiveLoans(member.id).length;
                const isSelected = selectedMemberIds.has(member.id);
                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectMember(member.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        title="Pilih anggota ini"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${member.avatarColor} text-white font-bold flex items-center justify-center shrink-0 shadow-sm`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            <HighlightMatch text={member.name} query={searchQuery} />
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            NISN/NIP: <HighlightMatch text={member.nisn_nip} query={searchQuery} />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800">
                        <HighlightMatch text={member.classOrDept} query={searchQuery} />
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            member.role === 'Guru'
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'Staf'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{member.phone || '-'}</span>
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {activeLoansCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <BookOpen className="w-3 h-3" />
                          {activeLoansCount} Buku Aktif
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">0 Pinjaman</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          member.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print ID Card */}
                        <button
                          onClick={() => onPrintMemberCard(member)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
                          title="Cetak Kartu Anggota Perpustakaan"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                          <span>Cetak Kartu</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Data Anggota"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setMemberToDeleteSingle(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Anggota */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingMember ? 'Edit Data Anggota' : 'Registrasi Anggota Perpustakaan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kartu anggota otomatis terhubung ke sistem peminjaman
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NISN / NIP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0078912345"
                    value={formData.nisn_nip}
                    onChange={(e) => setFormData({ ...formData, nisn_nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Anggota</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as MemberRole })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Staf">Staf Sekolah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas / Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: XII MIPA 2"
                    value={formData.classOrDept}
                    onChange={(e) => setFormData({ ...formData, classOrDept: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp/HP</label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keanggotaan</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as MemberStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Ditangguhkan">Ditangguhkan</option>
                  </select>
                </div>
              </div>

              {/* LocalStorage persistence notice */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-emerald-900">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                  <Save className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950">
                      Penyimpanan Permanen LocalStorage Browser
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-200/70 text-[10px] text-emerald-900 font-mono font-semibold">
                      Ctrl+S
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                    Data keanggotaan langsung disimpan permanen di LocalStorage browser dan <strong>tidak akan hilang saat halaman di-refresh</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all text-xs ring-2 ring-emerald-500/30 cursor-pointer"
                  title="Simpan data anggota ke LocalStorage browser"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingMember
                      ? 'Simpan Perubahan Anggota (LocalStorage)'
                      : 'Simpan Anggota Baru ke LocalStorage'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Batch Bar for Members */}
      {selectedMemberIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedMemberIds.size} Anggota Dipilih
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedMemberIds.size})</span>
            </button>

            <button
              type="button"
              onClick={clearAllMemberSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Batal pilih"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Anggota Berkelompok (Bulk Delete) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedMemberIds.size > 0
                      ? `Hapus ${selectedMemberIds.size} Anggota Sekaligus?`
                      : 'Hapus Anggota Secara Masal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedMemberIds.size > 0
                      ? 'Tindakan ini akan menghapus data keanggotaan terpilih secara permanen.'
                      : 'Pilih anggota yang ingin dihapus secara bersamaan.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedMemberIds.size === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <div className="text-xs text-slate-600">
                    Belum ada anggota yang dicentang. Silakan pilih opsi penghapusan masal:
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={selectAllMembersCatalog}
                      className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Pilih Seluruh Anggota ({members.length} Anggota)</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleSelectAllMembers}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Pilih Hasil Filter Saat Ini ({filteredMembers.length} Anggota)
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Check if any selected member has active loans */}
                  {(() => {
                    const selectedMembersList = members.filter((m) => selectedMemberIds.has(m.id));
                    const activeBorrowers = selectedMembersList.filter((m) => getActiveLoans(m.id).length > 0);
                    if (activeBorrowers.length > 0) {
                      return (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Peringatan Pinjaman Buku Aktif:</span>
                            <span>
                              {activeBorrowers.length} dari {selectedMemberIds.size} anggota yang dipilih saat ini masih tercatat meminjam buku perpustakaan! Pastikan buku telah dikembalikan sebelum menghapus data.
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Daftar anggota yang akan dihapus:
                    </span>
                    <button
                      type="button"
                      onClick={clearAllMemberSelection}
                      className="text-slate-400 hover:text-slate-600 underline text-[11px]"
                    >
                      Kosongkan Pilihan
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
                    {members
                      .filter((m) => selectedMemberIds.has(m.id))
                      .map((m) => (
                        <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div className="overflow-hidden pr-2">
                            <div className="font-semibold text-slate-900 truncate">{m.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {m.role} • {m.classOrDept} • NISN/NIP: {m.nisn_nip}
                            </div>
                          </div>
                          <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 whitespace-nowrap">
                            {getActiveLoans(m.id).length > 0 ? (
                              <span className="text-rose-600 font-bold">{getActiveLoans(m.id).length} pinjam</span>
                            ) : (
                              <span className="text-emerald-700">0 pinjam</span>
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batalkan
              </button>
              {selectedMemberIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const idsToDelete = Array.from(selectedMemberIds);
                    if (idsToDelete.length > 0) {
                      if (onDeleteMembersBulk) {
                        onDeleteMembersBulk(idsToDelete);
                      } else {
                        idsToDelete.forEach((id) => onDeleteMember(id));
                      }
                    }
                    clearAllMemberSelection();
                    setIsBulkDeleteModalOpen(false);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus {selectedMemberIds.size} Anggota</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Anggota Tunggal (Single Delete) */}
      {memberToDeleteSingle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Hapus Data Anggota?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfirmasi penghapusan data anggota perpustakaan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMemberToDeleteSingle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-sm">{memberToDeleteSingle.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {memberToDeleteSingle.role} • {memberToDeleteSingle.classOrDept} • NISN/NIP: {memberToDeleteSingle.nisn_nip}
                </div>
              </div>

              {getActiveLoans(memberToDeleteSingle.id).length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Anggota ini masih memiliki {getActiveLoans(memberToDeleteSingle.id).length} pinjaman buku yang belum dikembalikan!
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMemberToDeleteSingle(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMember(memberToDeleteSingle.id);
                  const next = new Set(selectedMemberIds);
                  next.delete(memberToDeleteSingle.id);
                  setSelectedMemberIds(next);
                  setMemberToDeleteSingle(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Anggota Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
