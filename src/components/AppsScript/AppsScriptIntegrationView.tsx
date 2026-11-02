import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Database,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Zap,
  Info,
  BookOpen,
  Users,
  Calendar,
  FileText,
  FileCode,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings, EBook } from '../../types/library';
import {
  getAppsScriptConfig,
  saveAppsScriptConfig,
  testAppsScriptConnection,
  pushAllDataToAppsScript,
  pullAllDataFromAppsScript,
  validateAppsScriptUrl,
  isAppsScriptNative,
  AppsScriptConfig,
  SyncStats,
} from '../../utils/appsScriptApi';
import { GOOGLE_APPS_SCRIPT_CODE, GOOGLE_APPS_SCRIPT_INDEX_HTML } from '../../data/appsScriptCode';

interface AppsScriptIntegrationViewProps {
  books: Book[];
  members: Member[];
  loans: LoanTransaction[];
  visitors: VisitorLog[];
  ebooks: EBook[];
  settings: LibrarySettings;
  onDataImported?: (data: {
    members?: Member[];
    books?: Book[];
    ebooks?: EBook[];
    loans?: LoanTransaction[];
    visitors?: VisitorLog[];
    settings?: Partial<LibrarySettings>;
  }) => void;
  showToast?: (message: string) => void;
}

export const AppsScriptIntegrationView: React.FC<AppsScriptIntegrationViewProps> = ({
  books,
  members,
  loans,
  visitors,
  ebooks,
  settings,
  onDataImported,
  showToast,
}) => {
  const [config, setConfig] = useState<AppsScriptConfig>(getAppsScriptConfig());
  const [inputUrl, setInputUrl] = useState<string>(config.url);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    spreadsheetName?: string;
    latencyMs?: number;
  } | null>(null);

  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    message: string;
    stats?: SyncStats;
  } | null>(null);

  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState<{
    success: boolean;
    message: string;
    counts?: {
      members?: number;
      books?: number;
      ebooks?: number;
      loans?: number;
      visitors?: number;
    };
  } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'code' | 'index-html' | 'tutorial'>('sync');
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isHtmlCopied, setIsHtmlCopied] = useState(false);

  useEffect(() => {
    const loaded = getAppsScriptConfig();
    setConfig(loaded);
    setInputUrl(loaded.url);
  }, []);

  const handleToggleAutoSync = () => {
    const newAuto = !config.autoSync;
    const updated = saveAppsScriptConfig({ autoSync: newAuto });
    setConfig(updated);
    if (showToast) {
      showToast(newAuto ? 'Sinkronisasi otomatis ke Google Sheets AKTIF' : 'Sinkronisasi otomatis dinonaktifkan');
    }
  };

  const handleTestConnection = async () => {
    if (!config.isNativeEnvironment) {
      const validation = validateAppsScriptUrl(inputUrl);
      if (!validation.isValid) {
        setTestResult({
          success: false,
          message: validation.error || 'Format URL tidak valid',
        });
        return;
      }
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testAppsScriptConnection(inputUrl);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      const updated = saveAppsScriptConfig({
        url: inputUrl.trim(),
        spreadsheetName: res.spreadsheetName || null,
        spreadsheetUrl: res.spreadsheetUrl || null,
      });
      setConfig(updated);
      if (showToast) showToast('Koneksi ke Google Apps Script berhasil!');
    }
  };

  const handleSaveUrlOnly = () => {
    const updated = saveAppsScriptConfig({ url: inputUrl.trim() });
    setConfig(updated);
    if (showToast) showToast('URL Google Apps Script disimpan.');
  };

  const handlePushAll = async () => {
    if (!config.isNativeEnvironment && !inputUrl.trim()) {
      alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu atau jalankan langsung di script.google.com');
      return;
    }

    setIsPushing(true);
    setPushResult(null);

    const res = await pushAllDataToAppsScript(inputUrl.trim(), {
      members,
      books,
      ebooks,
      loans,
      visitors,
      settings,
    });

    setIsPushing(false);
    setPushResult({
      success: res.success,
      message: res.message,
      stats: res.stats,
    });

    if (res.success) {
      const updated = getAppsScriptConfig();
      setConfig(updated);
      if (showToast) showToast('Semua data berhasil disimpan ke Google Sheets!');
    }
  };

  const handlePullAll = async () => {
    if (!config.isNativeEnvironment && !inputUrl.trim()) {
      alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    const confirmPull = window.confirm(
      'Tarik data dari Google Sheets?\nData dari spreadsheet akan diperbarui ke aplikasi tanpa menghapus koleksi unggahan Anda.'
    );
    if (!confirmPull) return;

    setIsPulling(true);
    setPullResult(null);

    const res = await pullAllDataFromAppsScript(inputUrl.trim());
    setIsPulling(false);

    if (res.success && res.data) {
      const counts = {
        members: res.data.members?.length || 0,
        books: res.data.books?.length || 0,
        ebooks: res.data.ebooks?.length || 0,
        loans: res.data.loans?.length || 0,
        visitors: res.data.visitors?.length || 0,
      };

      setPullResult({
        success: true,
        message: res.message,
        counts,
      });

      if (onDataImported) {
        onDataImported(res.data);
      }

      const updated = getAppsScriptConfig();
      setConfig(updated);
      if (showToast) showToast('Data berhasil ditarik dan diperbarui dari Google Sheets!');
    } else {
      setPullResult({
        success: false,
        message: res.message,
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCodeCopied(true);
    if (showToast) showToast('Kode Code.gs berhasil disalin ke clipboard!');
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast('File Code.gs berhasil diunduh!');
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_INDEX_HTML);
    setIsHtmlCopied(true);
    if (showToast) showToast('Kode Index.html berhasil disalin!');
    setTimeout(() => setIsHtmlCopied(false), 2500);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_INDEX_HTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast('File Index.html berhasil diunduh!');
  };

  const formatDateTimeIndo = (isoString: string | null) => {
    if (!isoString) return 'Belum pernah disinkronkan';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Apps Script & Google Sheets Database</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Pusat Backend Google Sheets
            </h1>
            <p className="text-xs text-emerald-100/90 max-w-2xl mt-1 leading-relaxed">
              Aplikasi ini berfungsi di lingkungan Google Apps Script dan menggunakan spreadsheet Google Sheets sebagai basis data cloud. Semua berkas dan data yang Anda upload (Anggota, Katalog & Stok Buku, Koleksi E-Book PDF, Daftar Kunjungan, dan Siklus Peminjaman) tetap tersimpan rapi, aman, dan tersinkronisasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-900/60 backdrop-blur-md p-3.5 rounded-xl border border-emerald-500/30">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  config.isNativeEnvironment || config.url ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="text-[11px] font-bold text-slate-200">
                  {config.isNativeEnvironment
                    ? 'Native Google Apps Script Aktif'
                    : config.url
                    ? 'Backend Web App Terhubung'
                    : 'Belum Terhubung ke Sheets'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {config.lastSyncedAt
                    ? `Terakhir Sinkron: ${formatDateTimeIndo(config.lastSyncedAt)}`
                    : 'Siap untuk sinkronisasi'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Native GAS Notification Banner */}
      {config.isNativeEnvironment && (
        <div className="bg-emerald-900/40 border border-emerald-500/60 rounded-xl p-4 text-emerald-200 text-xs flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <strong className="text-emerald-100">Lingkungan Apps Script Terdeteksi!</strong> Aplikasi saat ini berjalan langsung di dalam runtime Google Apps Script. Komunikasi dengan spreadsheet Google Sheets berlangsung secara langsung melalui <code>google.script.run</code> tanpa memerlukan URL Web App eksternal.
          </div>
        </div>
      )}

      {/* Database Snapshot Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{members.length}</div>
            <div className="text-[11px] font-medium text-slate-500">Anggota Terdaftar</div>
            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Tersimpan Permanen</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{books.length}</div>
            <div className="text-[11px] font-medium text-slate-500">Katalog & Stok Buku</div>
            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Tersimpan Permanen</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{ebooks.length}</div>
            <div className="text-[11px] font-medium text-slate-500">Koleksi E-Book PDF</div>
            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Tersimpan Permanen</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{loans.length}</div>
            <div className="text-[11px] font-medium text-slate-500">Siklus Peminjaman</div>
            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Jan – Nov 2026</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{visitors.length}</div>
            <div className="text-[11px] font-medium text-slate-500">Presensi Kunjungan</div>
            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Jan – Nov 2026</div>
          </div>
        </div>
      </div>

      {/* Sub navigation tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'sync'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pengaturan URL & Sinkronisasi Cloud</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'code'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Source Code Code.gs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('index-html')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'index-html'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Template Index.html Apps Script</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tutorial')}
          className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'tutorial'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Panduan Deploy Lengkap</span>
        </button>
      </div>

      {/* TAB 1: SINKRONISASI & URL */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          {/* URL Configuration Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-600" />
                  Konfigurasi Koneksi Google Apps Script
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hubungkan spreadsheet Google Sheets sebagai pusat penyimpanan database cloud sekolah Anda.
                </p>
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Auto-Sync Realtime:</span>
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 focus:outline-none"
                  title="Otomatis kirim perubahan data ke Google Sheets setiap kali ada pembaruan"
                >
                  {config.autoSync ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                  <span>{config.autoSync ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>
            </div>

            {!config.isNativeEnvironment ? (
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || (!config.isNativeEnvironment && !inputUrl.trim())}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menguji...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Tes Koneksi</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveUrlOnly}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Simpan URL
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span>Aplikasi terhubung langsung ke Google Sheets aktif melalui <code>google.script.run</code>.</span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Cek Status Native</span>
                </button>
              </div>
            )}

            {/* Test result feedback banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{testResult.message}</div>
                  {testResult.spreadsheetName && (
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Spreadsheet Aktif: <strong>{testResult.spreadsheetName}</strong>
                      {testResult.latencyMs && ` (${testResult.latencyMs} ms)`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sync Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Push All to Google Sheets */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Simpan & Sinkronkan Data ke Google Sheets (Push)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Menyimpan seluruh data yang telah diunggah dan disimpan ke dalam 6 Sheet spreadsheet Google Sheets:
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Sheet <strong>ANGGOTA</strong>: {members.length} anggota
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Sheet <strong>KATALOG_BUKU</strong>: {books.length} buku & stok
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Sheet <strong>EBOOK_PDF</strong>: {ebooks.length} buku digital
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Sheet <strong>SIRKULASI_PINJAM</strong>: {loans.length} riwayat & siklus pinjam
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Sheet <strong>PRESENSI_KUNJUNGAN</strong>: {visitors.length} presensi Januari - November 2026
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Sheet <strong>PENGATURAN</strong>: Konfigurasi denda & batas pinjam
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePushAll}
                  disabled={isPushing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Kirim Semua Data ke Google Sheets Sekarang</span>
                    </>
                  )}
                </button>

                {pushResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      pushResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {pushResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{pushResult.message}</div>
                      {pushResult.stats && (
                        <div className="text-[11px] text-emerald-700 mt-1">
                          Tersimpan: {pushResult.stats.membersCount} Anggota, {pushResult.stats.booksCount} Buku, {pushResult.stats.ebooksCount} E-Book, {pushResult.stats.loansCount} Sirkulasi, {pushResult.stats.visitorsCount} Kunjungan.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Pull All from Google Sheets */}
            <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <DownloadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Tarik Data dari Google Sheets (Pull / Import)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Memperbarui data lokal dengan rekaman yang baru ditambahkan atau diedit di spreadsheet Google Sheets secara aman:
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Perlindungan File & Berkas Unggahan</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Proses penarikan menggabungkan data tanpa menghapus PDF binary atau item yang tersimpan di basis data lokal aplikasi.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePullAll}
                  disabled={isPulling}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all cursor-pointer"
                >
                  {isPulling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengambil data dari Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      <span>Tarik Data Terbaru dari Google Sheets</span>
                    </>
                  )}
                </button>

                {pullResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      pullResult.success
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {pullResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{pullResult.message}</div>
                      {pullResult.counts && (
                        <div className="text-[11px] text-blue-700 mt-1">
                          Diperbarui: {pullResult.counts.members} Anggota, {pullResult.counts.books} Buku, {pullResult.counts.ebooks} E-Book, {pullResult.counts.loans} Sirkulasi, {pullResult.counts.visitors} Kunjungan.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE.GS SCRIPT SOURCE */}
      {activeSubTab === 'code' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Backend Script: Code.gs (Google Apps Script)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin atau unduh kode ini untuk dipasang di editor Google Apps Script spreadsheet Anda.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                {isCodeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCodeCopied ? 'Tersalin!' : 'Salin Code.gs'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCode}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Code.gs</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] p-4 max-h-[520px] overflow-y-auto">
            <pre className="whitespace-pre leading-relaxed select-all">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: INDEX.HTML SOURCE */}
      {activeSubTab === 'index-html' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-teal-600" />
                Frontend Web App: Index.html (Google Apps Script)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Buat file HTML baru di Google Apps Script dengan nama <code>Index.html</code> untuk menjalankan aplikasi langsung di dalam Google Workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                {isHtmlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isHtmlCopied ? 'Tersalin!' : 'Salin Index.html'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Index.html</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] p-4 max-h-[520px] overflow-y-auto">
            <pre className="whitespace-pre leading-relaxed select-all">
              {GOOGLE_APPS_SCRIPT_INDEX_HTML}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: STEP-BY-STEP TUTORIAL */}
      {activeSubTab === 'tutorial' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Panduan Menjalankan Sistem Perpustakaan di Google Apps Script
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ikuti langkah berikut untuk mengaktifkan Google Sheets sebagai database online aplikasi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-800">Buat Google Spreadsheet</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka tab baru dan ketikkan <a href="https://sheet.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline">sheet.new</a>. Beri nama file, misalnya: <em>"Database Perpustakaan Digital MA Roudlotul Jadid"</em>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-800">Buka Menu Ekstensi &gt; Apps Script</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di Google Sheets, klik menu <strong>Ekstensi</strong> &gt; pilih <strong>Apps Script</strong>. Editor kode Google akan terbuka.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-800">Pasang Code.gs & Index.html</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pada file <code>Code.gs</code>, paste seluruh kode dari tab <strong>Source Code Code.gs</strong>. Kemudian klik ikon <strong>+</strong> &gt; <strong>HTML</strong>, beri nama <code>Index</code>, dan paste kode dari tab <strong>Template Index.html</strong>. Simpan proyek.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-800">Deploy sebagai Web App</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Klik tombol biru <strong>Deploy (Terapkan)</strong> &gt; <strong>New deployment (Penerapan baru)</strong>:
                <br />- Pilih jenis: <strong>Web app (Aplikasi web)</strong>
                <br />- Execute as: <strong>Me (Akun Google Anda)</strong>
                <br />- Who has access: <strong>Anyone (Siapa saja)</strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                5
              </div>
              <h4 className="text-sm font-bold text-emerald-900">Salin URL & Sinkronkan</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Salin URL Web App yang berakhiran <code>/exec</code>, tempelkan ke kolom URL di tab <strong>Pengaturan URL & Sinkronisasi Cloud</strong>, lalu klik <strong>Tes Koneksi</strong> dan <strong>Kirim Semua Data ke Google Sheets</strong>. Enam sheet database akan otomatis terisi dan siap digunakan!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
