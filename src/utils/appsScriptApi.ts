/**
 * API Connector & Sync Engine untuk Google Apps Script & Google Sheets
 * Aplikasi Perpustakaan Digital MA Roudlotul Jadid
 * Mendukung 2 mode eksekusi:
 * 1. Native Apps Script (google.script.run saat dijalankan di dalam script.google.com)
 * 2. Remote Web App REST API (fetch doGet/doPost saat dijalankan di browser/hosting luar)
 */

import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings, EBook } from '../types/library';

// Deklarasi tipe global untuk Google Apps Script HTML Service API
declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: (fn: (result: any) => void) => {
            withFailureHandler: (fn: (error: any) => void) => Record<string, (...args: any[]) => void>;
          };
          [key: string]: any;
        };
      };
    };
  }
}

const STORAGE_KEYS = {
  URL: 'pustaka_apps_script_url',
  LAST_SYNC: 'pustaka_apps_script_last_sync',
  AUTO_SYNC: 'pustaka_apps_script_auto_sync',
  SHEET_NAME: 'pustaka_apps_script_sheet_name',
  SHEET_URL: 'pustaka_apps_script_sheet_url',
};

export interface AppsScriptConfig {
  url: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  isNativeEnvironment: boolean;
}

export interface SyncStats {
  membersCount: number;
  booksCount: number;
  ebooksCount: number;
  loansCount: number;
  visitorsCount: number;
}

export interface AppsScriptResponse {
  status: 'success' | 'error';
  message: string;
  timestamp?: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
  stats?: SyncStats;
  data?: any;
}

/**
 * Deteksi apakah aplikasi sedang berjalan langsung di lingkungan Google Apps Script
 */
export function isAppsScriptNative(): boolean {
  return typeof window !== 'undefined' && Boolean(window.google?.script?.run);
}

/**
 * Pemanggilan fungsi server secara native via google.script.run
 */
export function callAppsScriptNative<T = any>(functionName: string, ...args: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isAppsScriptNative()) {
      reject(new Error('Lingkungan Google Apps Script tidak terdeteksi.'));
      return;
    }
    try {
      const runner = window.google!.script.run
        .withSuccessHandler((res: any) => resolve(res))
        .withFailureHandler((err: any) => reject(new Error(err?.message || String(err))));

      if (typeof (runner as any)[functionName] === 'function') {
        (runner as any)[functionName](...args);
      } else {
        reject(new Error(`Fungsi server ${functionName} tidak ditemukan di Code.gs.`));
      }
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Membaca konfigurasi Google Apps Script yang tersimpan di LocalStorage
 */
export function getAppsScriptConfig(): AppsScriptConfig {
  try {
    const url = localStorage.getItem(STORAGE_KEYS.URL) || '';
    const lastSyncedAt = localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || null;
    const autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === 'true';
    const spreadsheetName = localStorage.getItem(STORAGE_KEYS.SHEET_NAME) || null;
    const spreadsheetUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL) || null;
    const isNative = isAppsScriptNative();

    return {
      url,
      lastSyncedAt,
      autoSync,
      spreadsheetName: isNative ? (spreadsheetName || 'Google Sheets Aktif') : spreadsheetName,
      spreadsheetUrl,
      isNativeEnvironment: isNative,
    };
  } catch (err) {
    console.warn('Gagal membaca konfigurasi Apps Script:', err);
    return {
      url: '',
      lastSyncedAt: null,
      autoSync: false,
      spreadsheetName: null,
      spreadsheetUrl: null,
      isNativeEnvironment: isAppsScriptNative(),
    };
  }
}

/**
 * Menyimpan konfigurasi Google Apps Script ke LocalStorage
 */
export function saveAppsScriptConfig(config: Partial<AppsScriptConfig>): AppsScriptConfig {
  try {
    if (config.url !== undefined) {
      localStorage.setItem(STORAGE_KEYS.URL, config.url.trim());
    }
    if (config.lastSyncedAt !== undefined) {
      if (config.lastSyncedAt) {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, config.lastSyncedAt);
      } else {
        localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      }
    }
    if (config.autoSync !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, config.autoSync ? 'true' : 'false');
    }
    if (config.spreadsheetName !== undefined) {
      if (config.spreadsheetName) {
        localStorage.setItem(STORAGE_KEYS.SHEET_NAME, config.spreadsheetName);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SHEET_NAME);
      }
    }
    if (config.spreadsheetUrl !== undefined) {
      if (config.spreadsheetUrl) {
        localStorage.setItem(STORAGE_KEYS.SHEET_URL, config.spreadsheetUrl);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
      }
    }
  } catch (err) {
    console.error('Gagal menyimpan konfigurasi Apps Script:', err);
  }
  return getAppsScriptConfig();
}

/**
 * Validasi sintaks URL Web App Google Apps Script
 */
export function validateAppsScriptUrl(url: string): { isValid: boolean; error?: string } {
  if (isAppsScriptNative()) {
    return { isValid: true };
  }
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL Google Apps Script belum diisi.' };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
    return {
      isValid: false,
      error: 'Format URL harus berawalan "https://script.google.com/macros/s/..."',
    };
  }
  if (!trimmed.endsWith('/exec')) {
    return {
      isValid: false,
      error: 'URL Web App harus berakhiran "/exec" (bukan /edit atau /dev)',
    };
  }
  return { isValid: true };
}

/**
 * Tes koneksi ke Backend Apps Script (Native maupun REST Web App)
 */
export async function testAppsScriptConnection(url?: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();

  // 1. Jika berjalan native di dalam Apps Script (google.script.run)
  if (isAppsScriptNative()) {
    try {
      const res: any = await callAppsScriptNative('apiPing');
      const latencyMs = Date.now() - startTime;
      saveAppsScriptConfig({
        spreadsheetName: res.spreadsheetName || 'Database Spreadsheet',
        spreadsheetUrl: res.spreadsheetUrl || null,
      });
      return {
        success: true,
        message: 'Terhubung langsung ke Google Sheets via Google Apps Script Native!',
        spreadsheetName: res.spreadsheetName,
        spreadsheetUrl: res.spreadsheetUrl,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal memanggil fungsi apiPing di Google Apps Script: ' + (err?.message || err),
      };
    }
  }

  // 2. Jika berjalan via REST API Web App URL
  const targetUrl = (url || getAppsScriptConfig().url || '').trim();
  const validation = validateAppsScriptUrl(targetUrl);
  if (!validation.isValid) {
    return { success: false, message: validation.error || 'URL tidak valid' };
  }

  const pingUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&_t=' + startTime;

  try {
    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        success: false,
        message: `Koneksi gagal dengan status HTTP ${res.status} (${res.statusText})`,
        latencyMs,
      };
    }

    const json: AppsScriptResponse = await res.json();
    if (json.status === 'success') {
      saveAppsScriptConfig({
        url: targetUrl,
        spreadsheetName: json.spreadsheetName || 'Database Spreadsheet',
        spreadsheetUrl: json.spreadsheetUrl || null,
      });

      return {
        success: true,
        message: json.message || 'Berhasil terhubung ke Google Apps Script!',
        spreadsheetName: json.spreadsheetName,
        spreadsheetUrl: json.spreadsheetUrl,
        latencyMs,
      };
    } else {
      return {
        success: false,
        message: json.message || 'Respon error dari Apps Script',
        latencyMs,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message:
        'Gagal menghubungi Apps Script. Pastikan Web App di-deploy dengan akses "Who has access: Anyone" dan browser mengizinkan redirect Google.',
    };
  }
}

/**
 * PUSH SEMUA DATA: Mengirimkan semua data lokal ke Google Sheets (Dukungan Native & REST)
 */
export async function pushAllDataToAppsScript(
  url: string | undefined,
  payloadData: {
    members: Member[];
    books: Book[];
    ebooks: EBook[];
    loans: LoanTransaction[];
    visitors: VisitorLog[];
    settings: LibrarySettings;
  }
): Promise<{
  success: boolean;
  message: string;
  syncedAt?: string;
  stats?: SyncStats;
}> {
  // 1. Eksekusi Native google.script.run jika berada di lingkungan Apps Script
  if (isAppsScriptNative()) {
    try {
      const res: any = await callAppsScriptNative('apiSyncAll', payloadData);
      const syncedAt = new Date().toISOString();
      saveAppsScriptConfig({ lastSyncedAt: syncedAt });
      return {
        success: true,
        message: res?.message || 'Semua data tersimpan otomatis di Google Sheets!',
        syncedAt,
        stats: res?.stats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal sync native Google Apps Script: ' + (err?.message || err),
      };
    }
  }

  // 2. Eksekusi REST API fetch
  const targetUrl = (url || getAppsScriptConfig().url || '').trim();
  const validation = validateAppsScriptUrl(targetUrl);
  if (!validation.isValid) {
    return { success: false, message: validation.error || 'URL tidak valid' };
  }

  const payload = {
    action: 'syncAll',
    members: payloadData.members,
    books: payloadData.books,
    ebooks: payloadData.ebooks,
    loans: payloadData.loans,
    visitors: payloadData.visitors,
    settings: payloadData.settings,
    sentAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP Error ${res.status}: Gagal mengirim data ke Google Sheets.`,
      };
    }

    const json: AppsScriptResponse = await res.json();
    const syncedAt = new Date().toISOString();

    if (json.status === 'success') {
      saveAppsScriptConfig({
        lastSyncedAt: syncedAt,
      });

      return {
        success: true,
        message: json.message || 'Semua data berhasil disinkronkan ke Google Sheets!',
        syncedAt,
        stats: json.stats,
      };
    } else {
      return {
        success: false,
        message: json.message || 'Gagal menyimpan data ke Google Sheets.',
      };
    }
  } catch (err: any) {
    console.error('Error saat push ke Apps Script:', err);
    return {
      success: false,
      message:
        'Koneksi terputus saat mengirim data. Pastikan pengaturan "Who has access" disetel ke "Anyone" pada penerapan Web App Google Apps Script.',
    };
  }
}

/**
 * PULL DATA: Mengambil data dari Google Sheets via Native Apps Script atau Web App REST
 */
export async function pullAllDataFromAppsScript(url?: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    members?: Member[];
    books?: Book[];
    ebooks?: EBook[];
    loans?: LoanTransaction[];
    visitors?: VisitorLog[];
    settings?: Partial<LibrarySettings>;
  };
}> {
  // 1. Eksekusi Native jika berada di lingkungan Google Apps Script
  if (isAppsScriptNative()) {
    try {
      const data: any = await callAppsScriptNative('apiGetAll');
      const syncedAt = new Date().toISOString();
      saveAppsScriptConfig({ lastSyncedAt: syncedAt });
      return {
        success: true,
        message: 'Data berhasil ditarik langsung dari Google Sheets!',
        data: data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal mengambil data native Apps Script: ' + (err?.message || err),
      };
    }
  }

  // 2. Eksekusi REST API
  const targetUrl = (url || getAppsScriptConfig().url || '').trim();
  const validation = validateAppsScriptUrl(targetUrl);
  if (!validation.isValid) {
    return { success: false, message: validation.error || 'URL tidak valid' };
  }

  const fullUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=getAll&_t=' + Date.now();

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Gagal menarik data dari Google Sheets (Status: ${res.status})`,
      };
    }

    const json = await res.json();
    if (json.status === 'success' && json.data) {
      const syncedAt = new Date().toISOString();
      saveAppsScriptConfig({ lastSyncedAt: syncedAt });

      return {
        success: true,
        message: 'Data berhasil ditarik dari Google Sheets!',
        data: json.data,
      };
    } else {
      return {
        success: false,
        message: json.message || 'Gagal memuat data dari spreadsheet.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal menghubungi Google Apps Script untuk penarikan data.',
    };
  }
}
