import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Compass,
  FileCheck,
  Download,
  Trash2,
  Filter,
  CheckCircle,
  GraduationCap,
  Briefcase,
  RefreshCw
} from 'lucide-react';
import { VisitorLog, Member, MemberRole, LibrarySettings } from '../../types/library';
import { formatDateIndo, getTodayDateString } from '../../utils/formatters';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../../utils/datePeriods';
import { PeriodFilterBar } from '../Common/PeriodFilterBar';
import { HighlightMatch } from '../Common/HighlightMatch';

interface VisitorLogViewProps {
  visitors: VisitorLog[];
  members: Member[];
  settings: LibrarySettings;
  onAddVisitor: (visitor: VisitorLog) => void;
  onDeleteVisitor: (id: string) => void;
  initialOpenInputModal?: boolean;
  onSyncHistory?: () => void;
}

export const VisitorLogView: React.FC<VisitorLogViewProps> = ({
  visitors,
  members,
  settings,
  onAddVisitor,
  onDeleteVisitor,
  initialOpenInputModal = false,
  onSyncHistory,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [selectedMonth2026, setSelectedMonth2026] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [isInputModalOpen, setIsInputModalOpen] = useState(initialOpenInputModal);

  // Form State for manual input
  const [entryMode, setEntryMode] = useState<'member' | 'guest'>('member');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [role, setRole] = useState<MemberRole | 'Tamu Umum'>('Siswa');
  const [classOrDept, setClassOrDept] = useState('');
  const [purpose, setPurpose] = useState<VisitorLog['purpose']>('Membaca di Tempat');
  const [visitDate, setVisitDate] = useState(getTodayDateString());
  const [visitTime, setVisitTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Filter visitors based on selected period or 2026 month or specific date
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      // 1. Month 2026 selector
      if (selectedMonth2026 !== 'ALL') {
        if (!v.date.startsWith(selectedMonth2026)) return false;
      }

      // 2. Specific date or period
      if (specificDate) {
        if (v.date !== specificDate) return false;
      } else if (selectedMonth2026 === 'ALL') {
        if (!isDateInPeriod(v.date, selectedPeriod)) return false;
      }

      // 3. Search query
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.classOrDept.toLowerCase().includes(q) ||
        (v.nisn_nip && v.nisn_nip.includes(q)) ||
        v.purpose.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [visitors, selectedPeriod, selectedMonth2026, specificDate, searchQuery]);

  // Statistics for the selected period
  const stats = useMemo(() => {
    const total = filteredVisitors.length;
    let studentCount = 0;
    let teacherCount = 0;
    let staffCount = 0;
    let guestCount = 0;
    const purposeMap: Record<string, number> = {};

    filteredVisitors.forEach((v) => {
      if (v.role === 'Siswa') studentCount++;
      else if (v.role === 'Guru') teacherCount++;
      else if (v.role === 'Staf') staffCount++;
      else guestCount++;

      purposeMap[v.purpose] = (purposeMap[v.purpose] || 0) + 1;
    });

    const topPurpose = Object.entries(purposeMap).sort((a, b) => b[1] - a[1])[0] || [
      'Belum ada data',
      0,
    ];

    return {
      total,
      studentCount,
      teacherCount,
      staffCount,
      guestCount,
      topPurposeName: topPurpose[0],
      topPurposeCount: topPurpose[1],
      purposeMap,
    };
  }, [filteredVisitors]);

  // Handle member selection
  const handleSelectMember = (m: Member) => {
    setSelectedMemberId(m.id);
    setName(m.name);
    setNisn(m.nisn_nip);
    setRole(m.role);
    setClassOrDept(m.classOrDept);
    setMemberSearchQuery(`${m.name} (${m.classOrDept})`);
  };

  // Submit manual visitor log
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newLog: VisitorLog = {
      id: `v-${Date.now()}`,
      date: visitDate || getTodayDateString(),
      time: visitTime || '08:00',
      memberId: selectedMemberId || undefined,
      nisn_nip: nisn,
      name,
      role,
      classOrDept: classOrDept || (role === 'Siswa' ? 'Siswa' : 'Umum'),
      purpose,
    };

    onAddVisitor(newLog);
    setSaveSuccessNotice(true);

    // Reset form
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setName('');
      setNisn('');
      setClassOrDept('');
      setMemberSearchQuery('');
      setSelectedMemberId('');
      setPurpose('Membaca di Tempat');
      setIsInputModalOpen(false);
    }, 1200);
  };

  // Filter members for autocomplete recommendations
  const memberMatches = useMemo(() => {
    if (!memberSearchQuery.trim() || selectedMemberId) return [];
    const q = memberSearchQuery.toLowerCase().trim();
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.nisn_nip.toLowerCase().includes(q) ||
          m.classOrDept.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [members, memberSearchQuery, selectedMemberId]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Waktu', 'NISN/NIP', 'Nama Pengunjung', 'Peran', 'Kelas/Unit', 'Keperluan'];
    const rows = filteredVisitors.map((v) => [
      `"${v.date}"`,
      `"${v.time}"`,
      `"${v.nisn_nip || '-'}"`,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.role}"`,
      `"${v.classOrDept}"`,
      `"${v.purpose}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rekap_kunjungan_perpus_${selectedPeriod}_${getTodayDateString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Daftar Kunjungan Perpustakaan
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {visitors.length} Total Presensi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan manual kehadiran siswa, guru, staf, serta rekapitulasi pengunjung per minggu, per bulan, dan per tahun
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            title="Ekspor daftar presensi pengunjung ke file CSV Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setIsInputModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Kunjungan Manual</span>
          </button>
        </div>
      </div>

      {/* 2026 Calendar & Schedule Rule Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 border border-white/20 inline-block mb-1.5">
            Presensi Kehadiran Terverifikasi 2026
          </span>
          <h2 className="text-base sm:text-lg font-bold">
            Rekapitulasi Kehadiran: 1 Januari 2026 – 2 November 2026 (Hari Ini)
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            Sesuai kalender akademik madrasah: <b>Setiap hari Jumat LIBUR RUTIN</b> perpustakaan, dan <b>hari Minggu tetap MASUK SEKOLAH</b>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedMonth2026('ALL');
              setSpecificDate('2026-11-02');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              specificDate === '2026-11-02'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            Hari Ini (2 Nov 2026)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth2026('ALL');
              setSpecificDate('');
              setSelectedPeriod('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              selectedMonth2026 === 'ALL' && !specificDate
                ? 'bg-emerald-400 text-slate-950 ring-2 ring-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            Lihat Semua 2026
          </button>
          {onSyncHistory && (
            <button
              type="button"
              onClick={onSyncHistory}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan Kehadiran Dari Data Saya</span>
            </button>
          )}
        </div>
      </div>

      {/* Month Filter Chips */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Pilih Bulan Kehadiran 2026:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: 'Semua 2026 (Jan - 2 Nov)' },
            { key: '2026-11', label: 'Nov 2026 (Hari Ini)' },
            { key: '2026-10', label: 'Okt 2026' },
            { key: '2026-09', label: 'Sep 2026' },
            { key: '2026-08', label: 'Agu 2026' },
            { key: '2026-07', label: 'Jul 2026' },
            { key: '2026-06', label: 'Jun 2026' },
            { key: '2026-05', label: 'Mei 2026' },
            { key: '2026-04', label: 'Apr 2026' },
            { key: '2026-03', label: 'Mar 2026' },
            { key: '2026-02', label: 'Feb 2026' },
            { key: '2026-01', label: 'Jan 2026' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setSelectedMonth2026(m.key);
                setSpecificDate('');
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedMonth2026 === m.key && !specificDate
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Universal Period Filter Bar: Minggu / Bulan / Tahun */}
      <PeriodFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={(p) => {
          setSelectedPeriod(p);
          setSpecificDate('');
        }}
        title="Rekapitulasi Kunjungan Berdasarkan Periode:"
        summaryText={`${filteredVisitors.length} Kunjungan Terdata`}
      />

      {/* Rekapitulasi Cards for Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengunjung */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pengunjung
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats.total} <span className="text-xs font-normal text-slate-500">Orang</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Periode: <b className="text-emerald-700">{getPeriodLabel(selectedPeriod)}</b>
          </div>
        </div>

        {/* Siswa */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pengunjung Siswa
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {stats.studentCount} <span className="text-xs font-normal text-slate-500">Siswa</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Persentase: {stats.total > 0 ? Math.round((stats.studentCount / stats.total) * 100) : 0}%
          </div>
        </div>

        {/* Guru & Staf */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Guru & Staf
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {stats.teacherCount + stats.staffCount}{' '}
            <span className="text-xs font-normal text-slate-500">Orang</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.teacherCount} Guru, {stats.staffCount} Staf
          </div>
        </div>

        {/* Keperluan Utama */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tujuan Terbanyak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={stats.topPurposeName}>
            {stats.topPurposeName}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dipilih oleh <b className="text-amber-700">{stats.topPurposeCount}</b> pengunjung
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pengunjung, NISN, kelas, atau keperluan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Specific Date Picker filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Tanggal Spesifik:</span>
          <input
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:border-emerald-500"
          />
          {specificDate && (
            <button
              onClick={() => setSpecificDate('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
              title="Reset ke filter periode"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800">
            Daftar Presensi ({filteredVisitors.length} Data)
          </span>
          <span className="text-[11px] text-slate-500">
            Periode: <b>{specificDate ? formatDateIndo(specificDate) : getPeriodLabel(selectedPeriod)}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-3">Nama Pengunjung</th>
                <th className="py-3 px-3">Peran & Kelas/Unit</th>
                <th className="py-3 px-3">Keperluan Kunjungan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisitors.length > 0 ? (
                filteredVisitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{formatDateIndo(v.date)}</div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{v.time} WIB</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{v.name}</div>
                      {v.nisn_nip ? (
                        <div className="text-[10px] font-mono text-slate-500">
                          NISN/NIP: {v.nisn_nip}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Tamu Pengunjung</div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{v.classOrDept}</span>
                      <div className="mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            v.role === 'Siswa'
                              ? 'bg-blue-100 text-blue-800'
                              : v.role === 'Guru'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {v.role}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        {v.purpose}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan kunjungan atas nama "${v.name}"?`)) {
                            onDeleteVisitor(v.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Catatan Kunjungan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada catatan kunjungan perpustakaan dalam periode{' '}
                    <b>{specificDate ? formatDateIndo(specificDate) : getPeriodLabel(selectedPeriod)}</b>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INPUT KUNJUNGAN MANUAL */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Input Kunjungan Perpustakaan Manual
                  </h3>
                  <p className="text-xs text-slate-500">
                    Catat kehadiran anggota perpustakaan atau tamu umum
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {saveSuccessNotice && (
              <div className="m-4 p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Presensi kunjungan berhasil dicatat!</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
              {/* Mode Switch: Anggota Terdaftar vs Tamu Bebas */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('member');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                    entryMode === 'member'
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pilih Anggota Terdaftar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('guest');
                    setSelectedMemberId('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                    entryMode === 'guest'
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Input Manual Tamu / Bebas
                </button>
              </div>

              {/* Mode Member: Search and Autocomplete */}
              {entryMode === 'member' ? (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-800">
                      Cari Data Anggota (Nama / NISN / NIP) <span className="text-rose-500">*</span>
                    </label>
                    {selectedMemberId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberId('');
                          setMemberSearchQuery('');
                          setName('');
                          setNisn('');
                          setClassOrDept('');
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
                      placeholder="Ketik huruf nama atau nomor NISN siswa/guru..."
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
                          setName('');
                          setNisn('');
                          setClassOrDept('');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Recommendation Dropdown */}
                  {!selectedMemberId && memberSearchQuery.trim() && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 animate-fade-in max-h-56 overflow-y-auto">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                        <span>Rekomendasi Anggota Sesuai Huruf ({memberMatches.length})</span>
                        <span className="text-[9px] font-normal text-slate-400">Pilih untuk isi</span>
                      </div>
                      {memberMatches.length > 0 ? (
                        memberMatches.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectMember(m)}
                            className="w-full text-left p-2 hover:bg-emerald-50/80 rounded-xl text-slate-800 flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
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
                                <div className="font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                                  <HighlightMatch text={m.name} query={memberSearchQuery} />
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {m.role} • <HighlightMatch text={m.classOrDept} query={memberSearchQuery} /> • NISN/NIP:{' '}
                                  <HighlightMatch text={m.nisn_nip} query={memberSearchQuery} />
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-semibold shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                              {m.role}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400 text-[11px]">
                          Tidak ditemukan anggota dengan huruf "{memberSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}

                  {selectedMemberId && (
                    <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-center justify-between">
                      <div>
                        <span className="font-bold">{name}</span>
                        <div className="text-slate-600">
                          {role} • {classOrDept} • NISN/NIP: {nisn}
                        </div>
                      </div>
                      <span className="text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                        Terpilih
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Mode Guest: Free text inputs */
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Nama Lengkap Pengunjung <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Gunawan (Alumni / Wali Murid)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Peran</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                      >
                        <option value="Siswa">Siswa</option>
                        <option value="Guru">Guru</option>
                        <option value="Staf">Staf</option>
                        <option value="Tamu Umum">Tamu Umum / Pengawas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">Kelas / Asal Instansi</label>
                      <input
                        type="text"
                        placeholder="Contoh: XII MIPA 1 / Dinas"
                        value={classOrDept}
                        onChange={(e) => setClassOrDept(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal & Waktu Kunjungan (Manual Picker) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kunjungan</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu Masuk</label>
                  <input
                    type="time"
                    required
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Keperluan Kunjungan */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Keperluan Kunjungan</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  <option value="Membaca di Tempat">Membaca di Tempat</option>
                  <option value="Meminjam / Mengembalikan">Meminjam / Mengembalikan Buku</option>
                  <option value="Mencari Referensi Tugas">Mencari Bahan Riset & Tugas</option>
                  <option value="Diskusi Kelompok">Diskusi Kelompok / Belajar Bersama</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className={`px-5 py-2 font-semibold rounded-xl text-white shadow-sm transition-all ${
                    name.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Simpan Presensi Kunjungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
