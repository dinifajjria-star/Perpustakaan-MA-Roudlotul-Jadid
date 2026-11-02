import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings, EBook, UserSession, AdminUser } from '../types/library';
import { initialBooks, initialMembers, initialLoans, initialVisitors, initialSettings, initialAdmins } from '../data/initialData';
import { initialEBooks } from '../data/initialEBooks';
import { generateCoverCanvasThumbnail } from './pdfThumbnail';
import { generateLibraryHistory } from './historyGenerator';

const STORAGE_KEYS = {
  BOOKS: 'pustaka_books_v1',
  MEMBERS: 'pustaka_members_v1',
  LOANS: 'pustaka_loans_v1',
  VISITORS: 'pustaka_visitors_v1',
  SETTINGS: 'pustaka_settings_v1',
  EBOOKS: 'pustaka_ebooks_v1',
  SESSION: 'pustaka_auth_session_v1',
  ADMINS: 'pustaka_admins_v1',
  HISTORY_SEEDED: 'pustaka_history_jan_nov_2026_seeded_v3',
};

// Integrated in-memory mock database cache
interface MemoryDb {
  books: Book[] | null;
  members: Member[] | null;
  loans: LoanTransaction[] | null;
  visitors: VisitorLog[] | null;
  settings: LibrarySettings | null;
  ebooks: EBook[] | null;
  admins: AdminUser[] | null;
  lastSaved: string | null;
}

const memoryDb: MemoryDb = {
  books: null,
  members: null,
  loans: null,
  visitors: null,
  settings: null,
  ebooks: null,
  admins: null,
  lastSaved: null,
};

// Broadcast data updates to window and integrated mock database
function notifyDatabaseSync(entity: string) {
  memoryDb.lastSaved = new Date().toISOString();
  if (typeof window !== 'undefined') {
    (window as any).__PUSTAKA_DB__ = memoryDb;
    try {
      window.dispatchEvent(
        new CustomEvent('pustaka_db_updated', {
          detail: { entity, timestamp: memoryDb.lastSaved },
        })
      );
    } catch (_) {}
  }
}

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (!raw) {
      if (memoryDb.books && memoryDb.books.length > 0) {
        return memoryDb.books;
      }
      saveBooks(initialBooks);
      return initialBooks;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryDb.books = parsed;
      return parsed;
    }
    return initialBooks;
  } catch (e) {
    console.error('Error loading books from storage:', e);
    return memoryDb.books || initialBooks;
  }
}

export function saveBooks(books: Book[]): void {
  try {
    memoryDb.books = books;
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    notifyDatabaseSync('books');
  } catch (e) {
    console.error('Error saving books:', e);
    // Even if localStorage fails (e.g. quota), keep in memory mock database
    memoryDb.books = books;
  }
}

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      if (memoryDb.members && memoryDb.members.length > 0) {
        return memoryDb.members;
      }
      saveMembers(initialMembers);
      return initialMembers;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryDb.members = parsed;
      return parsed;
    }
    return initialMembers;
  } catch (e) {
    console.error('Error loading members from storage:', e);
    return memoryDb.members || initialMembers;
  }
}

export function saveMembers(members: Member[]): void {
  try {
    memoryDb.members = members;
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    notifyDatabaseSync('members');
  } catch (e) {
    console.error('Error saving members:', e);
    memoryDb.members = members;
  }
}

export function getLocalStorageStatus(): {
  isAvailable: boolean;
  totalBooks: number;
  totalMembers: number;
  lastSaved: string;
} {
  const books = loadBooks();
  const members = loadMembers();
  return {
    isAvailable: typeof localStorage !== 'undefined',
    totalBooks: books.length,
    totalMembers: members.length,
    lastSaved: memoryDb.lastSaved || new Date().toISOString(),
  };
}

export function seedOrRefreshHistory(
  force: boolean = false,
  overrideMembers?: Member[],
  overrideBooks?: Book[]
): {
  visitors: VisitorLog[];
  loans: LoanTransaction[];
  updatedBooks: Book[];
} {
  const currentMembers = overrideMembers && overrideMembers.length > 0 ? overrideMembers : loadMembers();
  const currentBooks = overrideBooks && overrideBooks.length > 0 ? overrideBooks : loadBooks();
  const currentSettings = loadSettings();
  const currentAdmins = loadAdmins();

  const generated = generateLibraryHistory(currentMembers, currentBooks, {
    startDate: '2026-01-01',
    endDate: '2026-11-02',
    settings: currentSettings,
    admins: currentAdmins,
  });

  // Preserve any user-created custom loans or visitors if previously stored
  try {
    const rawLoans = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (rawLoans) {
      const prevLoans: LoanTransaction[] = JSON.parse(rawLoans);
      // Identify user-created loans (e.g. loans that don't start with trx-)
      const userCreated = prevLoans.filter((l) => l.id && !l.id.startsWith('trx-'));
      if (userCreated.length > 0) {
        generated.loans = [...userCreated, ...generated.loans];
      }
    }
    const rawVis = localStorage.getItem(STORAGE_KEYS.VISITORS);
    if (rawVis) {
      const prevVis: VisitorLog[] = JSON.parse(rawVis);
      const userVis = prevVis.filter((v) => v.id && !v.id.startsWith('v-'));
      if (userVis.length > 0) {
        generated.visitors = [...userVis, ...generated.visitors];
      }
    }
  } catch (e) {
    console.warn('History merge warning:', e);
  }

  saveVisitors(generated.visitors);
  saveLoans(generated.loans);
  saveBooks(generated.updatedBooks);
  // Re-save members to guarantee absolute preservation of all user inputs
  saveMembers(currentMembers);

  // Simulate realistic active reads for uploaded e-books as well since January 2026
  try {
    const currentEBooks = loadEBooks();
    let updatedEBooks = false;
    const primedEBooks = currentEBooks.map((eb, idx) => {
      if (!eb.readsCount || eb.readsCount === 0) {
        updatedEBooks = true;
        return {
          ...eb,
          readsCount: 18 + ((idx * 9 + 7) % 52),
        };
      }
      return eb;
    });
    if (updatedEBooks) {
      saveEBooks(primedEBooks);
    }
  } catch (_) {}

  localStorage.setItem(STORAGE_KEYS.HISTORY_SEEDED, 'true');

  return generated;
}

/**
 * Explicit helper to synchronize all 2026 visits and borrowing cycles
 * using the latest uploaded members and catalog books.
 */
export function syncHistoryFromUploadedData(
  members?: Member[],
  books?: Book[]
): {
  visitors: VisitorLog[];
  loans: LoanTransaction[];
  updatedBooks: Book[];
} {
  return seedOrRefreshHistory(true, members, books);
}

export function loadLoans(): LoanTransaction[] {
  try {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.HISTORY_SEEDED);
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (!isSeeded || !raw) {
      const generated = seedOrRefreshHistory(true);
      return generated.loans;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading loans from storage:', e);
    return initialLoans;
  }
}

export function saveLoans(loans: LoanTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  } catch (e) {
    console.error('Error saving loans:', e);
  }
}

export function loadVisitors(): VisitorLog[] {
  try {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.HISTORY_SEEDED);
    const raw = localStorage.getItem(STORAGE_KEYS.VISITORS);
    if (!isSeeded || !raw) {
      const generated = seedOrRefreshHistory(true);
      return generated.visitors;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading visitors from storage:', e);
    return initialVisitors;
  }
}

export function saveVisitors(visitors: VisitorLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(visitors));
  } catch (e) {
    console.error('Error saving visitors:', e);
  }
}

export function loadSettings(): LibrarySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(initialSettings);
      return initialSettings;
    }
    const parsed: LibrarySettings = JSON.parse(raw);
    let hasChanges = false;
    if (parsed.schoolName === 'SMA Negeri 1 Nusantara') {
      parsed.schoolName = initialSettings.schoolName;
      parsed.libraryName = initialSettings.libraryName;
      parsed.address = initialSettings.address;
      hasChanges = true;
    }
    if (parsed.finePerDay === 1000) {
      parsed.finePerDay = 2000;
      hasChanges = true;
    }
    if (hasChanges) {
      saveSettings(parsed);
    }
    return parsed;
  } catch (e) {
    console.error('Error loading settings from storage:', e);
    return initialSettings;
  }
}

export function saveSettings(settings: LibrarySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// ==================== E-BOOKS STORAGE ====================
export function loadEBooks(): EBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EBOOKS);
    if (!raw) {
      const primed = initialEBooks.map((eb) => ({
        ...eb,
        coverImageUrl: eb.coverImageUrl || eb.coverUrl || generateCoverCanvasThumbnail(eb.title),
      }));
      saveEBooks(primed);
      return primed;
    }
    const parsed: EBook[] = JSON.parse(raw);
    let updated = false;
    const normalized = parsed.map((eb) => {
      if (!eb.pdfFileName) {
        eb.pdfFileName = `${eb.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
        updated = true;
      }
      if (!eb.coverImageUrl && !eb.coverUrl) {
        eb.coverImageUrl = generateCoverCanvasThumbnail(eb.title);
        updated = true;
      }
      return eb;
    });
    if (updated) {
      saveEBooks(normalized);
    }
    return normalized;
  } catch (e) {
    console.error('Error loading eBooks from storage:', e);
    return initialEBooks.map((eb) => ({
      ...eb,
      coverImageUrl: eb.coverImageUrl || eb.coverUrl || generateCoverCanvasThumbnail(eb.title),
    }));
  }
}

export function saveEBooks(ebooks: EBook[]): void {
  try {
    memoryDb.ebooks = ebooks;
    localStorage.setItem(STORAGE_KEYS.EBOOKS, JSON.stringify(ebooks));
    notifyDatabaseSync('ebooks');
  } catch (e) {
    console.error('Error saving eBooks:', e);
    memoryDb.ebooks = ebooks;
  }
}

// ==================== AUTH SESSION STORAGE ====================
export function loadSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading session:', e);
    return null;
  }
}

export function saveSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.error('Error clearing session:', e);
  }
}

// ==================== ADMINS MANAGEMENT STORAGE ====================
export function loadAdmins(): AdminUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!raw) {
      saveAdmins(initialAdmins);
      return initialAdmins;
    }
    const parsed: AdminUser[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveAdmins(initialAdmins);
      return initialAdmins;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading admins from storage:', e);
    return initialAdmins;
  }
}

export function saveAdmins(admins: AdminUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  } catch (e) {
    console.error('Error saving admins:', e);
  }
}

export function exportAllData() {
  const data = {
    exportDate: new Date().toISOString(),
    books: loadBooks(),
    members: loadMembers(),
    loans: loadLoans(),
    visitors: loadVisitors(),
    settings: loadSettings(),
    ebooks: loadEBooks(),
    admins: loadAdmins(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-pustaka-sekolah-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetToDefaultData(): void {
  saveBooks(initialBooks);
  saveMembers(initialMembers);
  saveLoans(initialLoans);
  saveVisitors(initialVisitors);
  saveSettings(initialSettings);
  saveEBooks(initialEBooks);
  saveAdmins(initialAdmins);
}

