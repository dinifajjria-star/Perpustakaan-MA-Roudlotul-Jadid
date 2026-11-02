export type BookCategory =
  | 'Buku Teks Kurikulum Merdeka'
  | '000 - Karya Umum & Komputer'
  | '100 - Filsafat & Psikologi'
  | '200 - Agama'
  | '300 - Ilmu Sosial'
  | '400 - Bahasa'
  | '500 - Sains Murni & Matematika'
  | '600 - Teknologi & Terapan'
  | '700 - Kesenian & Olahraga'
  | '800 - Kesusastraan & Fiksi'
  | '900 - Sejarah & Geografi'
  | 'Referensi & Kamus';

export type BookCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type BookSource = 'BOS' | 'Hibah/Donasi' | 'Pembelian Sekolah' | 'Kemendikbud';

export interface Book {
  id: string;
  code: string;           // e.g. "BK-2024-001"
  callNumber: string;     // DDC Call number e.g. "510 PUR m"
  barcode: string;        // Barcode number e.g. "8992024001"
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishYear: number;
  category: BookCategory;
  rack: string;           // Lokasi rak e.g. "Rak A-02"
  totalCopies: number;    // Jumlah total eksemplar
  availableCopies: number;// Jumlah eksemplar tersedia
  condition: BookCondition;
  source: BookSource;
  price: number;          // Estimasi harga buku (Rp)
  synopsis: string;
  coverGradient: string;  // Visual cover aesthetic
  coverUrl?: string;      // Optional custom cover image
  addedDate: string;      // YYYY-MM-DD
}

export type MemberRole = 'Siswa' | 'Guru' | 'Staf';
export type MemberStatus = 'Aktif' | 'Nonaktif' | 'Ditangguhkan' | 'Alumni' | 'Mutasi';

export interface Member {
  id: string;
  nisn_nip: string;       // NISN for students, NIP for teachers
  name: string;
  role: MemberRole;
  classOrDept: string;    // e.g. "XII MIPA 1", "Guru Fisika"
  phone: string;
  email?: string;
  gender: 'L' | 'P';
  status: MemberStatus;
  joinDate: string;
  avatarColor: string;
}

export type TransactionStatus = 'Dipinjam' | 'Kembali' | 'Terlambat' | 'Hilang';

export type LoanCycleStage =
  | 'Peminjaman Baru'
  | 'Perpanjangan'
  | 'Peringatan Jatuh Tempo'
  | 'Pengembalian Tepat Waktu'
  | 'Terlambat & Denda'
  | 'Lunas Denda'
  | 'Penyelesaian Siklus';

export interface LoanCycleEvent {
  id: string;
  stage: LoanCycleStage;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm
  note: string;
  officer: string;
  daysExtended?: number;
  newDueDate?: string;
}

export interface LoanTransaction {
  id: string;
  transactionCode: string; // e.g. "TRX-202610-001"
  memberId: string;
  memberName: string;
  memberRole: MemberRole;
  memberClass: string;
  bookId: string;
  bookCode: string;
  bookTitle: string;
  bookCallNumber: string;
  borrowDate: string;     // YYYY-MM-DD
  dueDate: string;        // YYYY-MM-DD
  returnDate?: string;    // YYYY-MM-DD
  status: TransactionStatus;
  overdueDays: number;
  fineAmount: number;     // Rp
  finePaid: boolean;
  notes?: string;
  borrowCondition: BookCondition;
  returnCondition?: BookCondition;
  officer: string;        // Nama petugas

  // Loan Cycle Tracking
  renewalCount?: number;       // Berapa kali telah diperpanjang (0, 1, 2)
  maxRenewals?: number;        // Maksimal perpanjangan siklus (default 2x)
  cycleStatus?: 'Berjalan' | 'Diperpanjang' | 'Jatuh Tempo' | 'Selesai' | 'Denda Lunas';
  cycleDurationDays?: number;  // Durasi siklus dalam hari
  originalDueDate?: string;    // Tanggal jatuh tempo awal sebelum perpanjangan
  cycleHistory?: LoanCycleEvent[]; // Riwayat siklus lengkap
}

export interface VisitorLog {
  id: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  memberId?: string;
  nisn_nip?: string;
  name: string;
  role: MemberRole | 'Tamu Umum';
  classOrDept: string;
  purpose: 'Membaca di Tempat' | 'Meminjam / Mengembalikan' | 'Mencari Referensi Tugas' | 'Diskusi Kelompok' | 'Lainnya';
}

export interface LibrarySettings {
  schoolName: string;
  libraryName: string;
  npsn: string;           // Nomor Pokok Sekolah Nasional
  address: string;
  headmaster: string;     // Kepala Sekolah
  headLibrarian: string;  // Kepala Perpustakaan
  librarianNip: string;
  maxBorrowDaysStudent: number;
  maxBorrowDaysTeacher: number;
  maxBooksStudent: number;
  maxBooksTeacher: number;
  finePerDay: number;     // Rp 2.000 / hari
}

// ==================== E-BOOK TYPES ====================
export type EBookCategory =
  | 'Buku Teks Kurikulum Merdeka'
  | 'Pendidikan Agama Islam & Fikih'
  | 'Al-Qur\'an & Hadis'
  | 'Akidah & Akhlak'
  | 'Sejarah Kebudayaan Islam (SKI)'
  | 'Bahasa Arab & Sastra'
  | 'Bahasa Indonesia & Literasi'
  | 'Sains Murni & Matematika'
  | 'Ilmu Sosial & Ekonomi'
  | 'Pengembangan Diri & Motivasi'
  | 'Karya Sastra & Novel Santri'
  | 'Teknologi & Komputer';

export type EBookGradeLevel =
  | 'Kelas X'
  | 'Kelas XI'
  | 'Kelas XII'
  | 'Semua Tingkat / Umum'
  | 'Guru & Staf';

export interface EBookChapter {
  id: string;
  title: string;
  content: string; // Teks bacaan bab
}

export interface EBook {
  id: string;
  code: string;            // e.g. "EB-2024-001"
  isbn?: string;
  title: string;
  author: string;
  publisher: string;
  publishYear: number;
  category: EBookCategory;
  gradeLevel: EBookGradeLevel;
  totalPages: number;
  fileType: 'pdf_upload' | 'pdf_url' | 'digital_text' | 'file_upload';
  fileUrl?: string;        // External link atau URL dokumen PDF online
  pdfFileName?: string;    // Nama file asli PDF, e.g. "Buku_Fikih_Kelas_X.pdf"
  pdfFileSize?: number;    // Ukuran bytes file PDF
  hasUploadedPdf?: boolean;// Menandakan file PDF binary tersimpan di basis data IndexedDB
  pdfBlobUrl?: string;     // Runtime Object URL untuk pratinjau langsung
  chapters?: EBookChapter[]; // Bab bacaan teks langsung di browser
  synopsis: string;
  coverGradient: string;   // Tailwind gradient
  coverUrl?: string;       // Opsional gambar cover
  coverImageUrl?: string;  // Data URL / pratinjau halaman pertama dari PDF
  addedDate: string;       // YYYY-MM-DD
  readsCount: number;      // Jumlah pembaca
  fileSize?: string;       // e.g. "4.2 MB"
}

// ==================== AUTH & ADMIN TYPES ====================
export type UserRole = 'admin' | 'member';

export type AdminRole = 'Super Admin' | 'Pustakawan' | 'Staf Admin';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  password: string;
  role: AdminRole;
  phone?: string;
  email?: string;
  addedDate: string;       // YYYY-MM-DD
  avatarColor?: string;
  isDefault?: boolean;
}

export interface UserSession {
  role: UserRole;
  member?: Member;
  adminUsername?: string;
  adminName?: string;
  adminRole?: AdminRole;
  adminId?: string;
  loginTime: string;
}

