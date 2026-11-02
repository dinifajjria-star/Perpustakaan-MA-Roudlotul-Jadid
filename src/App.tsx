import React, { useState, useEffect } from 'react';
import {
  loadBooks,
  saveBooks,
  loadMembers,
  saveMembers,
  loadLoans,
  saveLoans,
  loadVisitors,
  saveVisitors,
  loadSettings,
  saveSettings,
  loadEBooks,
  saveEBooks,
  loadAdmins,
  saveAdmins,
  loadSession,
  saveSession,
  clearSession,
  seedOrRefreshHistory,
  syncHistoryFromUploadedData,
} from './utils/storage';
import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings, BookCondition, EBook, UserSession, AdminUser } from './types/library';
import { calculateDaysOverdue } from './utils/formatters';
import { deletePdfFromStorage, deleteMultiplePdfsFromStorage } from './utils/pdfStorage';
import { TimePeriod } from './utils/datePeriods';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { BookInventory } from './components/Inventory/BookInventory';
import { AddBookView } from './components/Inventory/AddBookView';
import { BorrowCirculation } from './components/Circulation/BorrowCirculation';
import { ReturnCirculation } from './components/Circulation/ReturnCirculation';
import { BookLoanCycleView } from './components/Circulation/BookLoanCycleView';
import { MemberManagement } from './components/Members/MemberManagement';
import { AddMemberView } from './components/Members/AddMemberView';
import { VisitorLogView } from './components/Visitors/VisitorLogView';
import { ReportsAndSettings } from './components/Reports/ReportsAndSettings';
import { PrintManager, PrintType } from './components/PrintTemplates/PrintManager';
import { BookDetailModal } from './components/Inventory/BookDetailModal';
import { LoginScreen } from './components/Auth/LoginScreen';
import { MemberPortalLayout } from './components/MemberPortal/MemberPortalLayout';
import { EBookCollection } from './components/EBooks/EBookCollection';
import { AdminManagementView } from './components/AdminManagement/AdminManagementView';
import { AppsScriptIntegrationView } from './components/AppsScript/AppsScriptIntegrationView';
import { getAppsScriptConfig, pushAllDataToAppsScript } from './utils/appsScriptApi';
import { Menu, X } from 'lucide-react';

export default function App() {
  // Primary State initialized directly from LocalStorage (persists across reloads)
  const [session, setSession] = useState<UserSession | null>(() => loadSession());
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [admins, setAdmins] = useState<AdminUser[]>(() => loadAdmins());
  const [loans, setLoans] = useState<LoanTransaction[]>(() => loadLoans());
  const [visitors, setVisitors] = useState<VisitorLog[]>(() => loadVisitors());
  const [ebooks, setEBooks] = useState<EBook[]>(() => loadEBooks());
  const [settings, setSettings] = useState<LibrarySettings>(() => loadSettings());

  // UI Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals & Details
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [editingBookForModal, setEditingBookForModal] = useState<Book | null>(null);
  const [printConfig, setPrintConfig] = useState<{
    isOpen: boolean;
    type: PrintType;
    data: any;
  }>({
    isOpen: false,
    type: 'labels',
    data: {},
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load state on mount
  useEffect(() => {
    const loadedBooks = loadBooks();
    const loadedMembers = loadMembers();
    const loadedLoans = loadLoans();
    const loadedVisitors = loadVisitors();
    const loadedSettings = loadSettings();
    const loadedEBooks = loadEBooks();
    const loadedAdmins = loadAdmins();

    // Dynamically update overdue days for active loans
    const updatedLoans = loadedLoans.map((loan) => {
      if (loan.status === 'Dipinjam' || loan.status === 'Terlambat') {
        const days = calculateDaysOverdue(loan.dueDate);
        if (days > 0) {
          return {
            ...loan,
            status: 'Terlambat' as const,
            overdueDays: days,
            fineAmount: days * loadedSettings.finePerDay,
          };
        }
      }
      return loan;
    });

    setBooks(loadedBooks);
    setMembers(loadedMembers);
    setLoans(updatedLoans);
    setVisitors(loadedVisitors);
    setSettings(loadedSettings);
    setEBooks(loadedEBooks);
    setAdmins(loadedAdmins);
  }, []);

  // Background Auto-sync to Google Sheets jika diaktifkan atau berjalan native di Apps Script
  useEffect(() => {
    const config = getAppsScriptConfig();
    if (!config.autoSync && !config.isNativeEnvironment) return;
    if (!config.isNativeEnvironment && !config.url) return;

    // Hindari push saat pertama kali mount sebelum state terisi
    if (books.length === 0 && members.length === 0) return;

    const timer = setTimeout(() => {
      pushAllDataToAppsScript(config.url, {
        members,
        books,
        ebooks,
        loans,
        visitors,
        settings,
      }).catch((e) => console.warn('Background auto-sync failed:', e));
    }, 2500);

    return () => clearTimeout(timer);
  }, [books.length, members.length, ebooks.length, loans.length, visitors.length]);

  // Auth Handlers
  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    saveSession(newSession);
    if (newSession.role === 'member' && newSession.member) {
      showToast(`Selamat datang di Perpustakaan, ${newSession.member.name}!`);
    } else {
      showToast(`Selamat datang, ${newSession.adminName || 'Petugas Perpustakaan'}!`);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    showToast('Anda telah keluar dari sistem perpustakaan.');
  };

  // Admin Management Handlers
  const handleAddAdmin = (newAdmin: AdminUser) => {
    const updated = [newAdmin, ...admins];
    setAdmins(updated);
    saveAdmins(updated);
    showToast(`Akun admin @${newAdmin.username} (${newAdmin.name}) berhasil ditambahkan!`);
  };

  const handleUpdateAdmin = (updatedAdmin: AdminUser) => {
    const updated = admins.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a));
    setAdmins(updated);
    saveAdmins(updated);
    showToast(`Data akun @${updatedAdmin.username} berhasil diperbarui.`);
  };

  const handleDeleteAdmin = (adminId: string) => {
    const target = admins.find((a) => a.id === adminId);
    const updated = admins.filter((a) => a.id !== adminId);
    setAdmins(updated);
    saveAdmins(updated);
    showToast(`Akun admin @${target?.username || ''} berhasil dihapus.`);
  };

  const handleDeleteAdminsBulk = (adminIds: string[]) => {
    const updated = admins.filter((a) => !adminIds.includes(a.id));
    setAdmins(updated);
    saveAdmins(updated);
    showToast(`${adminIds.length} akun admin berhasil dihapus.`);
  };

  // E-Books Handlers
  const handleAddEBook = (newEBook: EBook) => {
    const updated = [newEBook, ...ebooks];
    setEBooks(updated);
    saveEBooks(updated);
    showToast(`E-Book "${newEBook.title}" berhasil ditambahkan.`);
  };

  const handleAddEBooksBulk = (newEBooks: EBook[]) => {
    setEBooks((prev) => {
      const updated = [...newEBooks, ...prev];
      saveEBooks(updated);
      return updated;
    });
    showToast(`${newEBooks.length} e-book berhasil diunggah masal & disimpan ke LocalStorage.`);
  };

  const handleUpdateEBook = (updatedEBook: EBook) => {
    const updated = ebooks.map((eb) => (eb.id === updatedEBook.id ? updatedEBook : eb));
    setEBooks(updated);
    saveEBooks(updated);
    showToast(`E-Book "${updatedEBook.title}" diperbarui.`);
  };

  const handleDeleteEBook = (ebookId: string) => {
    deletePdfFromStorage(ebookId).catch(() => {});
    setEBooks((prev) => {
      const updated = prev.filter((eb) => eb.id !== ebookId);
      saveEBooks(updated);
      return updated;
    });
    showToast('E-Book berhasil dihapus dari koleksi digital.');
  };

  const handleDeleteEBooksBulk = (ebookIds: string[]) => {
    deleteMultiplePdfsFromStorage(ebookIds).catch(() => {});
    const idSet = new Set(ebookIds);
    setEBooks((prev) => {
      const updated = prev.filter((eb) => !idSet.has(eb.id));
      saveEBooks(updated);
      return updated;
    });
    showToast(`${ebookIds.length} e-book berhasil dihapus.`);
  };

  const handleIncrementEBookRead = (ebookId: string) => {
    setEBooks((prev) => {
      const updated = prev.map((eb) => (eb.id === ebookId ? { ...eb, readsCount: (eb.readsCount || 0) + 1 } : eb));
      saveEBooks(updated);
      return updated;
    });
  };

  // Save Books
  const handleAddBook = (newBook: Book) => {
    setBooks((prev) => {
      const updated = [newBook, ...prev];
      saveBooks(updated);
      return updated;
    });
    showToast(`Buku "${newBook.title}" berhasil ditambahkan & disimpan ke LocalStorage.`);
  };

  const handleSyncHistory = (customMembers?: Member[], customBooks?: Book[]) => {
    const m = customMembers || members;
    const b = customBooks || books;
    const result = syncHistoryFromUploadedData(m, b);
    setVisitors(result.visitors);
    setLoans(result.loans);
    setBooks(result.updatedBooks);
    setEBooks(loadEBooks());
    showToast(`Berhasil! Riwayat kunjungan & siklus sirkulasi 2026 disinkronkan dari ${m.length} anggota dan ${b.length} buku.`);
  };

  const handleAddBooksBulk = (newBooks: Book[]) => {
    const updated = [...newBooks, ...books];
    setBooks(updated);
    saveBooks(updated);
    // Auto-sync history so uploaded books are immediately active in the 2026 circulation cycle
    const result = syncHistoryFromUploadedData(members, updated);
    setVisitors(result.visitors);
    setLoans(result.loans);
    setBooks(result.updatedBooks);
    showToast(`${newBooks.length} buku berhasil diimpor & siklus sirkulasi 2026 otomatis disinkronkan.`);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === updatedBook.id ? updatedBook : b));
      saveBooks(updated);
      return updated;
    });
    showToast(`Perubahan buku "${updatedBook.title}" berhasil disimpan ke LocalStorage.`);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => {
      const updated = prev.filter((b) => b.id !== bookId);
      saveBooks(updated);
      return updated;
    });
    showToast('Buku berhasil dihapus dari katalog LocalStorage.');
  };

  const handleDeleteBooksBulk = (bookIds: string[]) => {
    const idSet = new Set(bookIds);
    setBooks((prev) => {
      const updated = prev.filter((b) => !idSet.has(b.id));
      saveBooks(updated);
      return updated;
    });
    showToast(`${bookIds.length} buku berhasil dihapus dari katalog LocalStorage.`);
  };

  // Save Members
  const handleAddMember = (newMember: Member) => {
    const updated = [newMember, ...members];
    setMembers(updated);
    saveMembers(updated);
    showToast(`Anggota "${newMember.name}" berhasil terdaftar & disimpan ke LocalStorage.`);
  };

  const handleAddMembersBulk = (newMembers: Member[]) => {
    const updated = [...newMembers, ...members];
    setMembers(updated);
    saveMembers(updated);
    // Auto-sync history so uploaded members immediately have 2026 visits and loan cycles!
    const result = syncHistoryFromUploadedData(updated, books);
    setVisitors(result.visitors);
    setLoans(result.loans);
    setBooks(result.updatedBooks);
    showToast(`${newMembers.length} anggota berhasil didaftarkan & riwayat kunjungan/siklus 2026 otomatis diperbarui!`);
  };

  const handleUpdateMember = (updatedMember: Member) => {
    setMembers((prev) => {
      const updated = prev.map((m) => (m.id === updatedMember.id ? updatedMember : m));
      saveMembers(updated);
      return updated;
    });
    showToast(`Data anggota "${updatedMember.name}" berhasil diperbarui di LocalStorage.`);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      saveMembers(updated);
      return updated;
    });
    showToast('Anggota berhasil dihapus.');
  };

  const handleDeleteMembersBulk = (memberIds: string[]) => {
    const idSet = new Set(memberIds);
    setMembers((prev) => {
      const updated = prev.filter((m) => !idSet.has(m.id));
      saveMembers(updated);
      return updated;
    });
    showToast(`${memberIds.length} anggota berhasil dihapus secara massal.`);
  };

  // Circulation: Add Loan (Peminjaman)
  const handleAddLoan = (newLoan: LoanTransaction) => {
    // 1. Add to loans list
    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    // 2. Decrement available copies of the book
    const updatedBooks = books.map((b) => {
      if (b.id === newLoan.bookId) {
        return {
          ...b,
          availableCopies: Math.max(0, b.availableCopies - 1),
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    saveBooks(updatedBooks);

    showToast(`Peminjaman "${newLoan.bookTitle}" berhasil dicatat.`);
  };

  const handleUpdateLoan = (updatedLoan: LoanTransaction) => {
    setLoans((prev) => {
      const updated = prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l));
      saveLoans(updated);
      return updated;
    });
    showToast(`Siklus transaksi "${updatedLoan.transactionCode}" berhasil diperbarui & disimpan.`);
  };

  // Circulation: Process Return (Pengembalian)
  const handleProcessReturn = (
    loanId: string,
    returnDate: string,
    condition: BookCondition,
    isLost: boolean,
    fineAmount: number,
    finePaid: boolean,
    notes: string
  ) => {
    let returnedBookId = '';

    // 1. Update loan record
    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        returnedBookId = l.bookId;
        return {
          ...l,
          returnDate,
          status: isLost ? ('Hilang' as const) : ('Kembali' as const),
          returnCondition: condition,
          fineAmount,
          finePaid,
          notes: notes ? `${l.notes ? l.notes + ' | ' : ''}${notes}` : l.notes,
        };
      }
      return l;
    });

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    // 2. If not lost, increment book available copies
    if (!isLost && returnedBookId) {
      const updatedBooks = books.map((b) => {
        if (b.id === returnedBookId) {
          return {
            ...b,
            availableCopies: Math.min(b.totalCopies, b.availableCopies + 1),
            condition: condition !== 'Baik' ? condition : b.condition,
          };
        }
        return b;
      });
      setBooks(updatedBooks);
      saveBooks(updatedBooks);
    }

    showToast('Buku berhasil dikembalikan!');
  };

  // Visitor log
  const handleAddVisitor = (newLog: VisitorLog) => {
    const updated = [newLog, ...visitors];
    setVisitors(updated);
    saveVisitors(updated);
    showToast(`Presensi kunjungan "${newLog.name}" berhasil dicatat.`);
  };

  const handleDeleteVisitor = (visitorId: string) => {
    const updated = visitors.filter((v) => v.id !== visitorId);
    setVisitors(updated);
    saveVisitors(updated);
    showToast('Catatan kunjungan berhasil dihapus.');
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: LibrarySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('Pengaturan perpustakaan berhasil diperbarui.');
  };

  // Reload all from storage (used after JSON restore or reset)
  const handleDataRestored = () => {
    setBooks(loadBooks());
    setMembers(loadMembers());
    setLoans(loadLoans());
    setVisitors(loadVisitors());
    setSettings(loadSettings());
    setEBooks(loadEBooks());
    setAdmins(loadAdmins());
    showToast('Data berhasil dimuat ulang!');
  };

  // Generate randomized history from Jan 2026 preserving user-inputted members and books
  const handleGenerateHistory = () => {
    const result = seedOrRefreshHistory(true);
    setBooks(result.updatedBooks);
    setLoans(result.loans);
    setVisitors(result.visitors);
    showToast(`Riwayat sirkulasi (${result.loans.length}) & kunjungan (${result.visitors.length}) 2026 berhasil digenerate! Jumat libur, Minggu aktif.`);
  };

  // Print Handlers
  const openPrintLabels = (selectedBooks: Book[]) => {
    setPrintConfig({
      isOpen: true,
      type: 'labels',
      data: { books: selectedBooks },
    });
  };

  const openPrintMemberCard = (member: Member) => {
    setPrintConfig({
      isOpen: true,
      type: 'member-card',
      data: { member },
    });
  };

  const openPrintSlip = (loan: LoanTransaction) => {
    setPrintConfig({
      isOpen: true,
      type: 'borrow-slip',
      data: { loan },
    });
  };

  const openPrintReceipt = (loan: LoanTransaction) => {
    setPrintConfig({
      isOpen: true,
      type: 'return-receipt',
      data: { loan },
    });
  };

  const openPrintMonthlyReport = (period: TimePeriod = 'month') => {
    setPrintConfig({
      isOpen: true,
      type: 'monthly-report',
      data: { allBooks: books, loans, period },
    });
  };

  const openPrintBlankMemberForm = () => {
    setPrintConfig({
      isOpen: true,
      type: 'blank-member-form',
      data: {},
    });
  };

  const openPrintBlankBookForm = () => {
    setPrintConfig({
      isOpen: true,
      type: 'blank-book-form',
      data: {},
    });
  };

  const handleDataImportedFromAppsScript = (data: {
    members?: Member[];
    books?: Book[];
    ebooks?: EBook[];
    loans?: LoanTransaction[];
    visitors?: VisitorLog[];
    settings?: Partial<LibrarySettings>;
  }) => {
    if (data.members && data.members.length > 0) {
      setMembers((prev) => {
        const map = new Map<string, Member>();
        prev.forEach((m) => map.set(m.id, m));
        data.members!.forEach((m) => {
          if (m && m.id) {
            const existing = map.get(m.id);
            map.set(m.id, { ...existing, ...m });
          }
        });
        const merged = Array.from(map.values());
        saveMembers(merged);
        return merged;
      });
    }

    if (data.books && data.books.length > 0) {
      setBooks((prev) => {
        const map = new Map<string, Book>();
        prev.forEach((b) => map.set(b.id, b));
        data.books!.forEach((b) => {
          if (b && b.id) {
            const existing = map.get(b.id);
            map.set(b.id, {
              ...existing,
              ...b,
              totalCopies: Number(b.totalCopies) || 1,
              availableCopies: b.availableCopies !== undefined ? Number(b.availableCopies) : (existing?.availableCopies ?? 1),
            });
          }
        });
        const merged = Array.from(map.values());
        saveBooks(merged);
        return merged;
      });
    }

    if (data.ebooks && data.ebooks.length > 0) {
      setEBooks((prev) => {
        const map = new Map<string, EBook>();
        prev.forEach((eb) => map.set(eb.id, eb));
        data.ebooks!.forEach((eb) => {
          if (eb && eb.id) {
            const existing = map.get(eb.id);
            map.set(eb.id, {
              ...existing,
              ...eb,
              readsCount: Number((eb as any).readsCount ?? (eb as any).readCount) || (existing?.readsCount ?? 0),
            });
          }
        });
        const merged = Array.from(map.values());
        saveEBooks(merged);
        return merged;
      });
    }

    if (data.loans && data.loans.length > 0) {
      setLoans((prev) => {
        const map = new Map<string, LoanTransaction>();
        prev.forEach((l) => map.set(l.id, l));
        data.loans!.forEach((l) => {
          if (l && l.id) {
            map.set(l.id, l);
          }
        });
        const merged = Array.from(map.values());
        saveLoans(merged);
        return merged;
      });
    }

    if (data.visitors && data.visitors.length > 0) {
      setVisitors((prev) => {
        const map = new Map<string, VisitorLog>();
        prev.forEach((v) => map.set(v.id, v));
        data.visitors!.forEach((v) => {
          if (v && v.id) {
            map.set(v.id, v);
          }
        });
        const merged = Array.from(map.values());
        saveVisitors(merged);
        return merged;
      });
    }

    if (data.settings) {
      setSettings((prev) => {
        const merged = { ...prev, ...data.settings };
        saveSettings(merged);
        return merged;
      });
    }

    showToast('Data dari Google Sheets berhasil diselaraskan ke sistem lokal!');
  };

  // Quick navigation helpers
  const handleQuickBorrowBook = (book: Book) => {
    setActiveTab('loans');
  };

  const activeLoansCount = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat').length;
  const overdueLoansCount = loans.filter((l) => l.status === 'Terlambat' || l.overdueDays > 0).length;

  // 1. Unauthenticated: Show Login Screen
  if (!session) {
    return (
      <>
        <LoginScreen
          settings={settings}
          members={members}
          admins={admins}
          onLoginSuccess={handleLoginSuccess}
        />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // 2. Member Portal: Only Attendance, Catalog, and E-Books
  if (session.role === 'member' && session.member) {
    return (
      <>
        <MemberPortalLayout
          currentMember={session.member}
          settings={settings}
          books={books}
          ebooks={ebooks}
          visitors={visitors}
          onAddVisitor={handleAddVisitor}
          onLogout={handleLogout}
          onIncrementEBookRead={handleIncrementEBookRead}
        />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // 3. Admin Portal: Full suite + Koleksi E-Book Digital
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        overdueCount={overdueLoansCount}
        books={books}
        members={members}
        admins={admins}
        session={session}
        onLogout={handleLogout}
        onOpenAdmins={() => setActiveTab('admins')}
        onOpenAppsScript={() => setActiveTab('appsscript')}
        onSelectAdmin={() => setActiveTab('admins')}
        onOpenQuickBorrow={() => setActiveTab('loans')}
        onOpenAddBook={() => setActiveTab('add-book')}
        onOpenAddMember={() => setActiveTab('add-member')}
        onOpenQuickReturn={() => setActiveTab('returns')}
        onOpenVisitorModal={() => setActiveTab('add-visitor')}
        onSelectBook={(book) => setSelectedBookForDetail(book)}
        onSelectMember={(member) => {
          setActiveTab('members');
          openPrintMemberCard(member);
        }}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile menu trigger */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40 no-print">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-transform active:scale-90"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            activeLoansCount={activeLoansCount}
            overdueLoansCount={overdueLoansCount}
            totalBooksCount={books.length}
            totalEBooksCount={ebooks.length}
            totalAdminsCount={admins.length}
          />
        </div>

        {/* Sidebar Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 h-full bg-slate-900">
              <Sidebar
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                activeLoansCount={activeLoansCount}
                overdueLoansCount={overdueLoansCount}
                totalBooksCount={books.length}
                totalEBooksCount={ebooks.length}
                totalAdminsCount={admins.length}
              />
            </div>
          </div>
        )}

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              books={books}
              members={members}
              loans={loans}
              visitors={visitors}
              settings={settings}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenQuickBorrow={() => setActiveTab('loans')}
              onOpenQuickReturn={() => setActiveTab('returns')}
              onOpenAddBook={() => setActiveTab('add-book')}
              onOpenAddMember={() => setActiveTab('add-member')}
              onOpenVisitorModal={() => setActiveTab('visitors')}
              onSelectBook={(book) => setSelectedBookForDetail(book)}
              onSyncHistory={handleSyncHistory}
            />
          )}

          {activeTab === 'inventory' && (
            <BookInventory
              books={books}
              settings={settings}
              onAddBook={handleAddBook}
              onUpdateBook={handleUpdateBook}
              onDeleteBook={handleDeleteBook}
              onDeleteBooksBulk={handleDeleteBooksBulk}
              onOpenPrintLabels={openPrintLabels}
              onSelectBookDetail={(book) => setSelectedBookForDetail(book)}
              onQuickBorrowBook={handleQuickBorrowBook}
              initialEditingBook={editingBookForModal}
              onClearInitialEditingBook={() => setEditingBookForModal(null)}
            />
          )}

          {activeTab === 'ebooks' && (
            <EBookCollection
              ebooks={ebooks}
              isAdmin={true}
              onAddEBook={handleAddEBook}
              onAddEBooksBulk={handleAddEBooksBulk}
              onUpdateEBook={handleUpdateEBook}
              onDeleteEBook={handleDeleteEBook}
              onDeleteEBooksBulk={handleDeleteEBooksBulk}
              onIncrementReadCount={handleIncrementEBookRead}
            />
          )}

          {activeTab === 'add-book' && (
            <AddBookView
              booksCount={books.length}
              settings={settings}
              onAddBook={(newBook, print) => {
                handleAddBook(newBook);
                if (!print) setActiveTab('inventory');
              }}
              onAddBooksBulk={handleAddBooksBulk}
              onCancel={() => setActiveTab('inventory')}
              onPrintLabel={(book) => openPrintLabels([book])}
              onPrintBlankForm={openPrintBlankBookForm}
            />
          )}

          {activeTab === 'loans' && (
            <BorrowCirculation
              books={books}
              members={members}
              loans={loans}
              settings={settings}
              onAddLoan={handleAddLoan}
              onPrintSlip={openPrintSlip}
              onNavigateToReturns={() => setActiveTab('returns')}
              onNavigateToCycles={() => setActiveTab('loan-cycles')}
            />
          )}

          {activeTab === 'returns' && (
            <ReturnCirculation
              loans={loans}
              books={books}
              settings={settings}
              onProcessReturn={handleProcessReturn}
              onPrintReceipt={openPrintReceipt}
              onNavigateToCycles={() => setActiveTab('loan-cycles')}
            />
          )}

          {activeTab === 'loan-cycles' && (
            <BookLoanCycleView
              loans={loans}
              books={books}
              members={members}
              settings={settings}
              onUpdateLoan={handleUpdateLoan}
              onNavigateToBorrow={() => setActiveTab('loans')}
              onNavigateToReturn={() => setActiveTab('returns')}
              onPrintSlip={openPrintSlip}
              onSyncHistory={handleSyncHistory}
            />
          )}

          {activeTab === 'members' && (
            <MemberManagement
              members={members}
              loans={loans}
              settings={settings}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onDeleteMembersBulk={handleDeleteMembersBulk}
              onPrintMemberCard={openPrintMemberCard}
              onSyncHistory={handleSyncHistory}
            />
          )}

          {activeTab === 'add-member' && (
            <AddMemberView
              settings={settings}
              onAddMember={(newMember, print) => {
                handleAddMember(newMember);
                if (!print) setActiveTab('members');
              }}
              onAddMembersBulk={handleAddMembersBulk}
              onCancel={() => setActiveTab('members')}
              onPrintCard={(member) => openPrintMemberCard(member)}
              onPrintBlankForm={openPrintBlankMemberForm}
            />
          )}

          {(activeTab === 'visitors' || activeTab === 'add-visitor') && (
            <VisitorLogView
              visitors={visitors}
              members={members}
              settings={settings}
              onAddVisitor={handleAddVisitor}
              onDeleteVisitor={handleDeleteVisitor}
              initialOpenInputModal={activeTab === 'add-visitor'}
              onSyncHistory={handleSyncHistory}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAndSettings
              books={books}
              members={members}
              loans={loans}
              visitors={visitors}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onPrintOfficialReport={openPrintMonthlyReport}
              onDataRestored={handleDataRestored}
              onGenerateHistory={handleGenerateHistory}
              onOpenAppsScript={() => setActiveTab('appsscript')}
            />
          )}

          {activeTab === 'admins' && (
            <AdminManagementView
              admins={admins}
              currentSession={session}
              onAddAdmin={handleAddAdmin}
              onUpdateAdmin={handleUpdateAdmin}
              onDeleteAdmin={handleDeleteAdmin}
              onDeleteAdminsBulk={handleDeleteAdminsBulk}
            />
          )}

          {activeTab === 'appsscript' && (
            <AppsScriptIntegrationView
              books={books}
              members={members}
              loans={loans}
              visitors={visitors}
              ebooks={ebooks}
              settings={settings}
              onDataImported={handleDataImportedFromAppsScript}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Book Detail Modal */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          loans={loans}
          onClose={() => setSelectedBookForDetail(null)}
          onQuickBorrow={(book) => {
            setSelectedBookForDetail(null);
            handleQuickBorrowBook(book);
          }}
          onPrintLabel={(book) => openPrintLabels([book])}
          onEditBook={(book) => {
            setSelectedBookForDetail(null);
            setEditingBookForModal(book);
            setActiveTab('inventory');
          }}
        />
      )}

      {/* Print Preview & Print Manager Dialog */}
      {printConfig.isOpen && (
        <PrintManager
          type={printConfig.type}
          settings={settings}
          data={printConfig.data}
          onClose={() => setPrintConfig({ ...printConfig, isOpen: false })}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
