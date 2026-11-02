import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Printer,
  Sparkles,
  Phone,
  Mail,
  Library,
  UserCheck,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Save
} from 'lucide-react';
import { Member, MemberRole, MemberStatus, LibrarySettings } from '../../types/library';
import { BarcodeView } from '../Common/BarcodeView';
import { BulkImportModal } from '../Common/BulkImportModal';
import { downloadMemberCsvTemplate } from '../../utils/csvTemplates';
import { HighlightMatch } from '../Common/HighlightMatch';
import { suggestNewMemberNames } from '../../utils/recommendations';

interface AddMemberViewProps {
  settings: LibrarySettings;
  onAddMember: (member: Member, printImmediately?: boolean) => void;
  onAddMembersBulk?: (members: Member[]) => void;
  onCancel: () => void;
  onPrintCard: (member: Member) => void;
  onPrintBlankForm?: () => void;
}

interface MemberPreset {
  id: string;
  categoryTab: 'kelas-x' | 'kelas-xi' | 'kelas-xii' | 'guru' | 'staf';
  badge: string;
  name: string;
  role: MemberRole;
  classOrDept: string;
  gender: 'L' | 'P';
  phone: string;
  email: string;
  avatarColor: string;
}

export const AddMemberView: React.FC<AddMemberViewProps> = ({
  settings,
  onAddMember,
  onAddMembersBulk,
  onCancel,
  onPrintCard,
  onPrintBlankForm,
}) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [activePresetTab, setActivePresetTab] = useState<'kelas-x' | 'kelas-xi' | 'kelas-xii' | 'guru' | 'staf'>('kelas-x');
  const [appliedPresetNotice, setAppliedPresetNotice] = useState<string | null>(null);

  const avatarColors = [
    { label: 'Biru Siswa', value: 'bg-blue-600' },
    { label: 'Zamrud Ceria', value: 'bg-emerald-600' },
    { label: 'Ungu Akademik', value: 'bg-purple-600' },
    { label: 'Indigo Formal', value: 'bg-indigo-700' },
    { label: 'Amber Prestasi', value: 'bg-amber-600' },
    { label: 'Mawar Guru', value: 'bg-rose-700' },
    { label: 'Batu Staf', value: 'bg-slate-700' },
  ];

  const classPresets = [
    'X-A (Fase E)', 'X-B (Fase E)', 'X-C (Fase E)',
    'XI MIPA 1', 'XI MIPA 2', 'XI IPS 1', 'XI Keagamaan',
    'XII MIPA 1', 'XII MIPA 2', 'XII IPS 1', 'XII Keagamaan',
    'Guru Fikih & Ushul Fikih', 'Guru Bahasa Arab', 'Guru Al-Qur\'an Hadis',
    'Guru Matematika', 'Guru Fisika', 'Guru Bahasa Indonesia', 'Guru Sejarah Islam',
    'Staf Tata Usaha', 'Pustakawan', 'Teknisi IT & Lab'
  ];

  // PRESET TEMPLATES
  const memberPresets: MemberPreset[] = [
    // Kelas X
    {
      id: 'mp-x-a',
      categoryTab: 'kelas-x',
      badge: 'Fase E',
      name: 'Muhammad Farhan Al-Ghifari',
      role: 'Siswa',
      classOrDept: 'X-A (Fase E)',
      gender: 'L',
      phone: '0812-3456-7801',
      email: 'farhan.ghifari@siswa.id',
      avatarColor: 'bg-blue-600',
    },
    {
      id: 'mp-x-b',
      categoryTab: 'kelas-x',
      badge: 'Fase E',
      name: 'Aisyah Humaira Putri',
      role: 'Siswa',
      classOrDept: 'X-B (Fase E)',
      gender: 'P',
      phone: '0813-9876-5402',
      email: 'aisyah.humaira@siswa.id',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'mp-x-c',
      categoryTab: 'kelas-x',
      badge: 'Fase E',
      name: 'Bahrul Ulum Hidayat',
      role: 'Siswa',
      classOrDept: 'X-C (Fase E)',
      gender: 'L',
      phone: '0857-1122-3303',
      email: 'bahrul.ulum@siswa.id',
      avatarColor: 'bg-purple-600',
    },

    // Kelas XI
    {
      id: 'mp-xi-mipa',
      categoryTab: 'kelas-xi',
      badge: 'Fase F - MIPA',
      name: 'Rifqi Ramadhan Pratama',
      role: 'Siswa',
      classOrDept: 'XI MIPA 1',
      gender: 'L',
      phone: '0821-4455-6604',
      email: 'rifqi.ramadhan@siswa.id',
      avatarColor: 'bg-blue-600',
    },
    {
      id: 'mp-xi-agama',
      categoryTab: 'kelas-xi',
      badge: 'Fase F - Keagamaan',
      name: 'Nur Fadilah Zahra',
      role: 'Siswa',
      classOrDept: 'XI Keagamaan',
      gender: 'P',
      phone: '0878-5544-3305',
      email: 'nur.fadilah@siswa.id',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'mp-xi-ips',
      categoryTab: 'kelas-xi',
      badge: 'Fase F - IPS',
      name: 'Danial Al-Fatih',
      role: 'Siswa',
      classOrDept: 'XI IPS 1',
      gender: 'L',
      phone: '0819-2233-4406',
      email: 'danial.alfatih@siswa.id',
      avatarColor: 'bg-amber-600',
    },

    // Kelas XII
    {
      id: 'mp-xii-mipa',
      categoryTab: 'kelas-xii',
      badge: 'Kelas Akhir',
      name: 'Ahmad Faiz Al-Ghifari',
      role: 'Siswa',
      classOrDept: 'XII MIPA 1',
      gender: 'L',
      phone: '0812-9988-7707',
      email: 'faiz.ghifari@siswa.id',
      avatarColor: 'bg-indigo-700',
    },
    {
      id: 'mp-xii-agama',
      categoryTab: 'kelas-xii',
      badge: 'Kelas Akhir',
      name: 'Syifa Nurul Azizah',
      role: 'Siswa',
      classOrDept: 'XII Keagamaan',
      gender: 'P',
      phone: '0858-6677-8808',
      email: 'syifa.azizah@siswa.id',
      avatarColor: 'bg-purple-600',
    },

    // Guru
    {
      id: 'mp-guru-fikih',
      categoryTab: 'guru',
      badge: 'Pendidik',
      name: 'Ust. M. Choirul Anam, S.Pd.I',
      role: 'Guru',
      classOrDept: 'Guru Fikih & Ushul Fikih',
      gender: 'L',
      phone: '0821-3344-5510',
      email: 'choirul.anam@kemenag.go.id',
      avatarColor: 'bg-rose-700',
    },
    {
      id: 'mp-guru-arab',
      categoryTab: 'guru',
      badge: 'Pendidik',
      name: 'Ustdz. Nur Laili, S.Hum',
      role: 'Guru',
      classOrDept: 'Guru Bahasa Arab',
      gender: 'P',
      phone: '0819-7766-5511',
      email: 'nur.laili@kemenag.go.id',
      avatarColor: 'bg-indigo-700',
    },
    {
      id: 'mp-guru-mtk',
      categoryTab: 'guru',
      badge: 'Pendidik',
      name: 'Dra. Hj. Siti Maimunah, M.Pd.',
      role: 'Guru',
      classOrDept: 'Guru Matematika',
      gender: 'P',
      phone: '0812-4433-2212',
      email: 'siti.maimunah@kemenag.go.id',
      avatarColor: 'bg-emerald-600',
    },

    // Staf
    {
      id: 'mp-staf-tu',
      categoryTab: 'staf',
      badge: 'Tata Usaha',
      name: 'Ahmad Fauzi, S.Kom',
      role: 'Staf',
      classOrDept: 'Staf Tata Usaha & IT',
      gender: 'L',
      phone: '0813-7788-9914',
      email: 'fauzi.tu@gmail.com',
      avatarColor: 'bg-slate-700',
    },
    {
      id: 'mp-staf-perpus',
      categoryTab: 'staf',
      badge: 'Perpustakaan',
      name: 'Lilis Indriyani, S.I.Pust.',
      role: 'Staf',
      classOrDept: 'Staf Layanan Perpustakaan',
      gender: 'P',
      phone: '0857-4455-6615',
      email: 'lilis.perpus@gmail.com',
      avatarColor: 'bg-slate-700',
    },
  ];

  const generateNisn = (role: MemberRole) => {
    if (role === 'Siswa') {
      return '00' + Math.floor(10000000 + Math.random() * 90000000);
    } else {
      const year = 1980 + Math.floor(Math.random() * 15);
      const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
      const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
      return `${year}${month}${day} 201201 1 00${Math.floor(1 + Math.random() * 9)}`;
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    nisn_nip: generateNisn('Siswa'),
    role: 'Siswa' as MemberRole,
    classOrDept: 'X-A (Fase E)',
    phone: '',
    email: '',
    gender: 'L' as 'L' | 'P',
    status: 'Aktif' as MemberStatus,
    avatarColor: 'bg-blue-600',
  });

  const [printAfterSave, setPrintAfterSave] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const liveNameSuggestions = useMemo(() => {
    if (!formData.name || formData.name.trim().length < 2) return [];
    return suggestNewMemberNames(formData.name, 5);
  }, [formData.name]);

  const handleApplyPreset = (preset: MemberPreset) => {
    const nisn = generateNisn(preset.role);
    setFormData({
      name: preset.name,
      nisn_nip: nisn,
      role: preset.role,
      classOrDept: preset.classOrDept,
      gender: preset.gender,
      phone: preset.phone,
      email: preset.email,
      status: 'Aktif',
      avatarColor: preset.avatarColor,
    });
    setAppliedPresetNotice(`${preset.name} (${preset.classOrDept})`);
    setTimeout(() => setAppliedPresetNotice(null), 3000);
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      nisn_nip: generateNisn('Siswa'),
      role: 'Siswa',
      classOrDept: 'X-A (Fase E)',
      phone: '',
      email: '',
      gender: 'L',
      status: 'Aktif',
      avatarColor: 'bg-blue-600',
    });
  };

  // Switch role and apply appropriate default class
  const handleRoleChange = (newRole: MemberRole) => {
    let defaultClass = 'X-A (Fase E)';
    let defaultColor = 'bg-blue-600';
    if (newRole === 'Guru') {
      defaultClass = 'Guru Fikih & Ushul Fikih';
      defaultColor = 'bg-rose-700';
    } else if (newRole === 'Staf') {
      defaultClass = 'Staf Tata Usaha';
      defaultColor = 'bg-slate-700';
    }
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      nisn_nip: generateNisn(newRole),
      classOrDept: defaultClass,
      avatarColor: defaultColor,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nisn_nip.trim()) return;

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      ...formData,
      joinDate: new Date().toISOString().split('T')[0],
    };

    onAddMember(newMember, printAfterSave);

    if (printAfterSave) {
      onPrintCard(newMember);
    } else {
      setSuccessSaved(true);
      setTimeout(() => {
        setSuccessSaved(false);
        handleResetForm();
      }, 1500);
    }
  };

  const filteredPresets = memberPresets.filter((p) => p.categoryTab === activePresetTab);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Kembali ke Daftar Anggota"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Tambah Anggota Perpustakaan
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {settings.schoolName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registrasi kartu anggota perpustakaan santri, guru, dan staf dengan template cepat, cetak kartu CR-80, dan impor massal Excel/CSV.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadMemberCsvTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200"
            title="Unduh template tabel Excel/CSV data anggota"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Unduh Template CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
            title="Impor santri atau guru secara massal dari spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Impor Massal (Excel / CSV)</span>
          </button>

          {onPrintBlankForm && (
            <button
              type="button"
              onClick={onPrintBlankForm}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-all flex items-center gap-1.5"
              title="Cetak lembar kertas formulir pendaftaran fisik kosong"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Formulir Blanko</span>
            </button>
          )}
        </div>
      </div>

      {/* INTERACTIVE PRESET TEMPLATES BAR */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Pilih Template Anggota Siap Pakai (Isi Otomatis 1-Klik)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih jenjang kelas santri atau profesi pendidik MA Roudlotul Jadid untuk pengisian instan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Form Kosong</span>
            </button>
          </div>
        </div>

        {/* Preset Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-100">
          <button
            type="button"
            onClick={() => setActivePresetTab('kelas-x')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'kelas-x'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            🎓 Santri Kelas X (Fase E)
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('kelas-xi')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'kelas-xi'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            📗 Santri Kelas XI (Fase F)
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('kelas-xii')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'kelas-xii'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            📘 Santri Kelas XII
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('guru')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'guru'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            👨‍🏫 Ustadz & Guru Pendidik
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('staf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'staf'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            💼 Staf & Tenaga Kependidikan
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {filteredPresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3 rounded-xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {preset.gender === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 line-clamp-1">
                  {preset.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {preset.classOrDept} • {preset.role}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono text-slate-400">{preset.phone}</span>
                <span className="font-semibold text-emerald-700 group-hover:underline">
                  Gunakan Template →
                </span>
              </div>
            </button>
          ))}
        </div>

        {appliedPresetNotice && (
          <div className="text-xs text-emerald-800 font-semibold bg-emerald-100/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Template "{appliedPresetNotice}" berhasil dimuat ke formulir!</span>
          </div>
        )}
      </div>

      {successSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-sm">
              Anggota baru berhasil didaftarkan! Form siap untuk anggota selanjutnya.
            </span>
          </div>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
          >
            Lihat di Daftar Anggota
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Realtime Card Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Fields (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Role Selection Tabs */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Peran / Status Keanggotaan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Siswa', 'Guru', 'Staf'] as MemberRole[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      formData.role === r
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{r}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nama Lengkap with live recommendations */}
            <div className="relative">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Anggota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={formData.role === 'Siswa' ? 'Contoh: Ahmad Faiz Al-Ghifari' : 'Contoh: Ust. M. Choirul Anam, S.Pd.I'}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setShowNameSuggestions(true);
                }}
                onFocus={() => setShowNameSuggestions(true)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 text-sm font-medium"
              />

              {/* Live Member Name Suggestions Dropdown */}
              {showNameSuggestions && liveNameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-30 space-y-0.5 max-h-64 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Rekomendasi Nama Berdasarkan Ketikan:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNameSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {liveNameSuggestions.map((name, idx) => (
                    <button
                      key={name + idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          name: name,
                        }));
                        setShowNameSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg text-slate-800 flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                          <HighlightMatch text={name} query={formData.name} />
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Nama Siswa / Rekomendasi Madrasah
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        Siswa
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NISN / NIP & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {formData.role === 'Siswa' ? 'NISN (10 Digit)' : 'NIP / NUPTK'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.role === 'Siswa' ? '0067829101' : '19840512 200801 2 009'}
                  value={formData.nisn_nip}
                  onChange={(e) => setFormData({ ...formData, nisn_nip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'L' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      formData.gender === 'L'
                        ? 'bg-blue-50 text-blue-800 border-blue-400 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Laki-laki (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'P' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      formData.gender === 'P'
                        ? 'bg-rose-50 text-rose-800 border-rose-400 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Perempuan (P)
                  </button>
                </div>
              </div>
            </div>

            {/* Kelas atau Unit Kerja */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {formData.role === 'Siswa' ? 'Kelas Santri / Rombel' : 'Mata Pelajaran / Unit Jabatan'} <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder={formData.role === 'Siswa' ? 'Contoh: XI MIPA 1 / X-A (Fase E)' : 'Contoh: Guru Fikih / Staf TU'}
                  value={formData.classOrDept}
                  onChange={(e) => setFormData({ ...formData, classOrDept: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Preset Cepat:</span>
                  {classPresets
                    .filter((c) =>
                      formData.role === 'Siswa' ? c.startsWith('X') : formData.role === 'Guru' ? c.startsWith('Guru') : c.startsWith('Staf') || c.startsWith('Pustakawan')
                    )
                    .slice(0, 4)
                    .map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setFormData({ ...formData, classOrDept: preset })}
                        className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 px-2 py-0.5 rounded transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Kontak: HP/WA & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="nama@madrasah.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Warna Badge / Avatar */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tema Warna Kartu Anggota
              </label>
              <div className="flex flex-wrap gap-2">
                {avatarColors.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    onClick={() => setFormData({ ...formData, avatarColor: color.value })}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold text-white transition-all flex items-center gap-1.5 ${color.value} ${
                      formData.avatarColor === color.value ? 'ring-2 ring-offset-2 ring-emerald-600 scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span>{color.label}</span>
                    {formData.avatarColor === color.value && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Print Card Option */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printAfterSave}
                  onChange={(e) => setPrintAfterSave(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 text-xs">
                  Langsung cetak Kartu Anggota Perpustakaan setelah disimpan
                </span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/2 sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                  title="Simpan anggota baru ke LocalStorage browser"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Anggota ke LocalStorage</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Realtime Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Pratinjau Kartu Fisik (Ukuran CR-80)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Siap Laminating
                </span>
              </div>

              {/* CARD PREVIEW */}
              <div className="w-full h-56 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-4 flex flex-col justify-between shadow-xl relative overflow-hidden border border-slate-700">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-emerald-500/10 pointer-events-none" />

                {/* Card Top */}
                <div className="flex items-center gap-2.5 border-b border-white/15 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <Library className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black tracking-tight uppercase leading-tight">
                      KARTU ANGGOTA PERPUSTAKAAN
                    </h4>
                    <p className="text-[9px] text-emerald-300 font-medium">
                      {settings.schoolName}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex items-center gap-3 my-auto">
                  <div
                    className={`w-12 h-14 rounded-xl ${formData.avatarColor} text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0 border border-white/20`}
                  >
                    {formData.name.trim() ? formData.name.charAt(0) : '?'}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="text-xs font-bold truncate text-white">
                      {formData.name || '(Nama Lengkap Anggota)'}
                    </div>
                    <div className="text-[10px] text-emerald-300 font-mono">
                      NISN/NIP: {formData.nisn_nip || '-'}
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {formData.role} • {formData.classOrDept}
                    </div>
                    <div className="text-[8px] text-slate-400">
                      Maks Pinjam: {formData.role === 'Guru' ? settings.maxBooksTeacher : settings.maxBooksStudent} Buku ({formData.role === 'Guru' ? settings.maxBorrowDaysTeacher : settings.maxBorrowDaysStudent} Hari)
                    </div>
                  </div>
                </div>

                {/* Card Bottom with Barcode */}
                <div className="flex items-end justify-between pt-1.5 border-t border-white/15">
                  <div className="bg-white p-1 rounded">
                    <BarcodeView
                      value={formData.nisn_nip || '0000000000'}
                      height={18}
                      showText={false}
                      className="text-slate-900"
                    />
                  </div>
                  <div className="text-right text-[7px] text-slate-400 leading-tight">
                    <div>Kepala Perpustakaan</div>
                    <div className="font-semibold text-slate-200 mt-0.5">{settings.headLibrarian}</div>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded">
                    {formData.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kontak:</span>
                  <span className="text-slate-800">{formData.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Quick Helper Info */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 space-y-1.5">
              <span className="font-bold block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Impor Data Seluruh Siswa & Guru
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Unduh file <b>Template CSV</b> untuk membagikannya ke wali kelas atau staf tata usaha, lalu gunakan tombol <b>Impor Massal (Excel / CSV)</b> untuk mendaftarkan ratusan anggota dalam hitungan detik.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        type="members"
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportMembers={(newMembers) => {
          if (onAddMembersBulk) {
            onAddMembersBulk(newMembers);
          } else {
            newMembers.forEach((m) => onAddMember(m, false));
          }
        }}
      />
    </div>
  );
};
