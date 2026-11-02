import {
  LayoutDashboard,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  UserCheck,
  FileBarChart2,
  Settings,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Cloud,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'add-book'
  | 'ebooks'
  | 'loans'
  | 'returns'
  | 'loan-cycles'
  | 'members'
  | 'add-member'
  | 'visitors'
  | 'add-visitor'
  | 'reports'
  | 'admins'
  | 'appsscript';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeLoansCount: number;
  overdueLoansCount: number;
  totalBooksCount: number;
  totalEBooksCount?: number;
  totalAdminsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeLoansCount,
  overdueLoansCount,
  totalBooksCount,
  totalEBooksCount = 0,
  totalAdminsCount = 1,
}) => {
  const navSections = [
    {
      title: 'Menu Utama',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard Ikhtisar',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'loans' as ActiveTab,
          label: 'Peminjaman Buku',
          icon: ArrowUpRight,
          badge: activeLoansCount > 0 ? `${activeLoansCount} Aktif` : null,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'returns' as ActiveTab,
          label: 'Pengembalian & Denda',
          icon: ArrowDownLeft,
          badge: overdueLoansCount > 0 ? `${overdueLoansCount} Telat` : null,
          badgeColor: 'bg-rose-100 text-rose-800 font-semibold',
        },
        {
          id: 'loan-cycles' as ActiveTab,
          label: 'Siklus Peminjaman Buku',
          icon: RefreshCw,
          badge: 'Siklus 2026',
          badgeColor: 'bg-teal-500/20 text-teal-300 font-bold',
        },
      ],
    },
    {
      title: 'Inventaris & Koleksi',
      items: [
        {
          id: 'inventory' as ActiveTab,
          label: 'Katalog & Stok Buku',
          icon: BookOpen,
          badge: `${totalBooksCount} Judul`,
        },
        {
          id: 'ebooks' as ActiveTab,
          label: 'Koleksi E-Book (PDF)',
          icon: Sparkles,
          badge: `${totalEBooksCount} PDF`,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 font-bold',
        },
        {
          id: 'add-book' as ActiveTab,
          label: 'Tambah Buku Baru',
          icon: BookOpen,
          badge: '+ Input',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 font-bold',
        },
      ],
    },
    {
      title: 'Data Keanggotaan',
      items: [
        {
          id: 'members' as ActiveTab,
          label: 'Daftar Anggota',
          icon: Users,
          badge: null,
        },
        {
          id: 'add-member' as ActiveTab,
          label: 'Tambah Anggota Baru',
          icon: Users,
          badge: '+ Registrasi',
          badgeColor: 'bg-blue-500/20 text-blue-400 font-bold',
        },
      ],
    },
    {
      title: 'Layanan Kunjungan Perpus',
      items: [
        {
          id: 'visitors' as ActiveTab,
          label: 'Daftar Kunjungan Perpus',
          icon: UserCheck,
          badge: null,
        },
        {
          id: 'add-visitor' as ActiveTab,
          label: 'Input Kunjungan Manual',
          icon: UserCheck,
          badge: '+ Presensi',
          badgeColor: 'bg-teal-500/20 text-teal-300 font-bold',
        },
      ],
    },
    {
      title: 'Rekapitulasi & Laporan',
      items: [
        {
          id: 'reports' as ActiveTab,
          label: 'Rekapitulasi & Laporan',
          icon: FileBarChart2,
          badge: 'W/M/Y',
          badgeColor: 'bg-amber-500/20 text-amber-300 font-bold',
        },
      ],
    },
    {
      title: 'Akses & Pengguna',
      items: [
        {
          id: 'admins' as ActiveTab,
          label: 'Kelola Admin & Petugas',
          icon: ShieldCheck,
          badge: `${totalAdminsCount} Akun`,
          badgeColor: 'bg-purple-500/20 text-purple-300 font-bold',
        },
      ],
    },
    {
      title: 'Integrasi Cloud & Backend',
      items: [
        {
          id: 'appsscript' as ActiveTab,
          label: 'Google Apps Script',
          icon: Cloud,
          badge: 'Sheets API',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 font-bold',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none no-print">
      {/* Navigation sections */}
      <div className="p-3.5 space-y-4 overflow-y-auto">
        {navSections.map((sec, secIdx) => (
          <div key={secIdx}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-3">
              {sec.title}
            </p>
            <nav className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          item.badgeColor || (isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Institutional Info Card in Sidebar */}
      <div className="mt-auto p-4">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-200">
              Sistem Perpustakaan Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
            Mendukung inventaris barcode DDC & perhitungan denda otomatis.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
            <span>Versi 2.4 Digital</span>
            <span className="text-emerald-400">Tersinkronisasi</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
