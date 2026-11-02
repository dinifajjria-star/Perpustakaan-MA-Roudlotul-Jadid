import { Book, Member, AdminUser } from '../types/library';

// Pool of popular Indonesian MA / SMA student names for smart recommendations
export const STUDENT_NAME_SUGGESTIONS = [
  'Ahmad Fauzi Ridwan',
  'Aisyah Humaira Putri',
  'Ali Zainal Abidin',
  'Anisa Rahmawati',
  'Bagas Pratama Nugraha',
  'Bilqis Nur Azizah',
  'Chelsea Olivia Putri',
  'Dimas Aditya Pratama',
  'Fadhil Muhammad Ihsan',
  'Farhan Al-Ghifari',
  'Fathimah Az-Zahra',
  'Hafizh Al-Ayyubi',
  'Hanafi Syihabuddin',
  'Hasan Basri Al-Fatih',
  'Ibrahim Khalilullah',
  'Ilham Ramadhan Saputra',
  'Intan Permatasari',
  'Kamilia Wardani',
  'Khairun Nisa Salsabila',
  'Luthfi Hakim Ash-Shiddiq',
  'M. Zulfikar Al-Bantani',
  'Maulana Malik Ibrahim',
  'Muhammad Arifin Ilham',
  'Muhammad Faris Hidayat',
  'Muhammad Rizky Ramadhan',
  'Nabila Syakira',
  'Nadia Putri Rahayu',
  'Najwa Shihab Khairunnisa',
  'Naufal Azmi Al-Hafidz',
  'Nur Halizah',
  'Putri Ayu Lestari',
  'Rahmat Hidayatullah',
  'Rian Pratama Wijaya',
  'Rizka Amelia Putri',
  'Salma Nur Hanifah',
  'Siti Sarah Amalia',
  'Syifa Nurul Hidayah',
  'Taufiqur Rahman',
  'Umar Faruq Al-Faruqi',
  'Wahyu Dwi Santoso',
  'Yusuf Maulana Al-Habsyi',
  'Zahra Nurul Aini',
  'Zaidan Zaid Al-Khair',
];

// Pool of teacher & administrative staff names for admin recommendations
export const ADMIN_NAME_SUGGESTIONS: { name: string; username: string; role: 'Super Admin' | 'Pustakawan' | 'Staf Admin'; phone?: string }[] = [
  { name: 'Siti Rahmawati, S.I.Pust.', username: 'siti_rahma', role: 'Super Admin', phone: '0812-3456-7890' },
  { name: 'M. Fajar Shodiq, S.Pd.I.', username: 'fajar_shodiq', role: 'Pustakawan', phone: '0821-9876-5432' },
  { name: 'Nur Aini, A.Ma.', username: 'nur_aini', role: 'Staf Admin', phone: '0857-1122-3344' },
  { name: 'Drs. H. Bambang Subagyo, M.Pd.', username: 'bambang_subagyo', role: 'Super Admin', phone: '0813-8899-7766' },
  { name: 'K.H. Ahmad Zuhdi, M.Ag.', username: 'ahmad_zuhdi', role: 'Super Admin', phone: '0811-2233-4455' },
  { name: 'Dra. Hj. Siti Fatimah, M.Pd.', username: 'siti_fatimah', role: 'Pustakawan', phone: '0852-3344-5566' },
  { name: 'Ahmad Muzakki, S.Kom.', username: 'muzakki_it', role: 'Staf Admin', phone: '0878-9900-1122' },
  { name: 'Ustadz Abdul Wahid, Lc., M.H.', username: 'abdul_wahid', role: 'Pustakawan', phone: '0819-3322-1100' },
  { name: 'Zulfa Laila, S.Pd.', username: 'zulfa_laila', role: 'Staf Admin', phone: '0896-7788-9900' },
  { name: 'Rahmat Hidayat, S.Sos.', username: 'rahmat_hidayat', role: 'Staf Admin', phone: '0822-5566-7788' },
  { name: 'Nurul Hidayati, S.I.Pust.', username: 'nurul_pustaka', role: 'Pustakawan', phone: '0853-4455-6677' },
];

// Pool of standard curriculum textbooks & popular school books
export const BOOK_CATALOG_SUGGESTIONS = [
  {
    title: 'Matematika untuk SMA/MA Kelas XI (Kurikulum Merdeka)',
    author: 'Dicki Susanto, Savitri K. Sihombing',
    publisher: 'Pusat Perbukuan Kemendikbudristek',
    category: 'Buku Teks Kurikulum Merdeka' as const,
    callNumber: '510 SUS m',
    isbn: '978-602-244-540-1',
  },
  {
    title: 'Fikih Ibadah dan Muamalah Praktis untuk Madrasah Aliyah',
    author: 'K.H. Ahmad Zuhdi, M.Ag. & Tim Guru Fikih',
    publisher: 'Kemenag RI & Pustaka Roudlotul Jadid',
    category: '200 - Agama' as const,
    callNumber: '297.4 ZUH f',
    isbn: '978-623-144-012-3',
  },
  {
    title: 'Al-Qur\'an Hadis untuk MA Kelas X (Kurikulum Merdeka)',
    author: 'Drs. H. Mahrus As\'ad, M.Ag.',
    publisher: 'Direktorat KSKK Madrasah Kemenag RI',
    category: '200 - Agama' as const,
    callNumber: '297.1 MAH q',
    isbn: '978-623-144-001-7',
  },
  {
    title: 'Akidah Akhlak untuk MA Kelas XII',
    author: 'Dra. Hj. Siti Aminah, M.Pd.I.',
    publisher: 'Kemenag RI',
    category: '200 - Agama' as const,
    callNumber: '297.3 AMI a',
    isbn: '978-623-144-034-5',
  },
  {
    title: 'Sejarah Kebudayaan Islam (SKI) Madrasah Aliyah Kelas XI',
    author: 'Dr. H. Subhan, M.A.',
    publisher: 'Pustaka Progresif',
    category: '900 - Sejarah & Geografi' as const,
    callNumber: '959.8 SUB s',
    isbn: '978-602-899-102-4',
  },
  {
    title: 'Bahasa Arab Praktis untuk Siswa Madrasah Aliyah',
    author: 'Ustadz Ahmad Munawwir, Lc.',
    publisher: 'Erlangga Islamic',
    category: '400 - Bahasa' as const,
    callNumber: '492.7 MUN b',
    isbn: '978-602-298-761-0',
  },
  {
    title: 'Fisika Dasar: Prinsip dan Penerapan Edisi 7',
    author: 'David Halliday, Robert Resnick, Jearl Walker',
    publisher: 'Erlangga',
    category: '500 - Sains Murni & Matematika' as const,
    callNumber: '530 HAL f',
    isbn: '978-979-099-042-5',
  },
  {
    title: 'Biologi untuk SMA/MA Kelas XI Fase F',
    author: 'Rini Solihat, Eriyani',
    publisher: 'Pusat Perbukuan Kemendikbudristek',
    category: 'Buku Teks Kurikulum Merdeka' as const,
    callNumber: '570 SOL b',
    isbn: '978-602-244-842-6',
  },
  {
    title: 'Kimia untuk SMA/MA Kelas X (Fase E)',
    author: 'Ayuk Ratna Puspaningrum, Elizabeth Tjahjadarmawan',
    publisher: 'Kemendikbudristek',
    category: 'Buku Teks Kurikulum Merdeka' as const,
    callNumber: '540 PUS k',
    isbn: '978-602-244-556-2',
  },
  {
    title: 'Bahasa Indonesia: Cerdas Berbahasa dan Bersastra untuk SMA/MA',
    author: 'Engkos Kosasih',
    publisher: 'Erlangga',
    category: '400 - Bahasa' as const,
    callNumber: '410 KOS b',
    isbn: '978-602-434-210-4',
  },
  {
    title: 'Negeri 5 Menara (Kisah Perjalanan Santri Menuntut Ilmu)',
    author: 'A. Fuadi',
    publisher: 'Gramedia Pustaka Utama',
    category: '800 - Kesusastraan & Fiksi' as const,
    callNumber: '899.221 FUA n',
    isbn: '978-979-22-4861-6',
  },
  {
    title: 'Bumi Manusia',
    author: 'Pramoedya Ananta Toer',
    publisher: 'Lentera Dipantara',
    category: '800 - Kesusastraan & Fiksi' as const,
    callNumber: '899.221 TOE b',
    isbn: '978-979-97312-3-4',
  },
  {
    title: 'Kamus Al-Munawwir Arab - Indonesia Terlengkap',
    author: 'K.H. Ahmad Warson Munawwir',
    publisher: 'Pustaka Progressif',
    category: 'Referensi & Kamus' as const,
    callNumber: 'R 492.73 MUN k',
    isbn: '978-979-8956-00-9',
  },
];

/**
 * Filter and recommend members based on typed characters
 */
export function getMemberNameRecommendations(query: string, existingMembers: Member[], limit: number = 6): Member[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const matched = existingMembers.filter((m) => {
    return (
      m.name.toLowerCase().includes(cleanQ) ||
      m.nisn_nip.toLowerCase().includes(cleanQ) ||
      m.classOrDept.toLowerCase().includes(cleanQ)
    );
  });

  return matched.slice(0, limit);
}

/**
 * Filter and recommend admins based on typed characters
 */
export function getAdminNameRecommendations(query: string, existingAdmins: AdminUser[], limit: number = 6): AdminUser[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const matched = existingAdmins.filter((a) => {
    return (
      a.name.toLowerCase().includes(cleanQ) ||
      a.username.toLowerCase().includes(cleanQ) ||
      (a.email && a.email.toLowerCase().includes(cleanQ)) ||
      a.role.toLowerCase().includes(cleanQ)
    );
  });

  return matched.slice(0, limit);
}

/**
 * Suggest new admin names when creating an admin, matching typed letters against admin pool
 */
export function suggestNewAdminNames(query: string, existingAdmins: AdminUser[], limit: number = 5) {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return ADMIN_NAME_SUGGESTIONS.slice(0, limit);

  return ADMIN_NAME_SUGGESTIONS.filter((s) => {
    const isAlreadyRegistered = existingAdmins.some(
      (a) => a.username.toLowerCase() === s.username.toLowerCase() || a.name.toLowerCase() === s.name.toLowerCase()
    );
    if (isAlreadyRegistered) return false;

    return (
      s.name.toLowerCase().includes(cleanQ) ||
      s.username.toLowerCase().includes(cleanQ) ||
      s.role.toLowerCase().includes(cleanQ)
    );
  }).slice(0, limit);
}

/**
 * Suggest student/member names when registering new members, matching typed letters
 */
export function suggestNewMemberNames(query: string, limit: number = 6): string[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return STUDENT_NAME_SUGGESTIONS.slice(0, limit);

  return STUDENT_NAME_SUGGESTIONS.filter((name) =>
    name.toLowerCase().includes(cleanQ)
  ).slice(0, limit);
}

/**
 * Filter and recommend books based on typed characters
 */
export function getBookRecommendations(query: string, existingBooks: Book[], limit: number = 6): Book[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const matched = existingBooks.filter((b) => {
    return (
      b.title.toLowerCase().includes(cleanQ) ||
      b.author.toLowerCase().includes(cleanQ) ||
      b.code.toLowerCase().includes(cleanQ) ||
      b.callNumber.toLowerCase().includes(cleanQ) ||
      b.isbn.toLowerCase().includes(cleanQ) ||
      b.publisher.toLowerCase().includes(cleanQ) ||
      b.rack.toLowerCase().includes(cleanQ)
    );
  });

  return matched.slice(0, limit);
}

/**
 * Suggest standard textbook titles when adding new books
 */
export function suggestBookCatalogTitles(query: string, limit: number = 6) {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return BOOK_CATALOG_SUGGESTIONS.slice(0, limit);

  return BOOK_CATALOG_SUGGESTIONS.filter(
    (b) =>
      b.title.toLowerCase().includes(cleanQ) ||
      b.author.toLowerCase().includes(cleanQ) ||
      b.publisher.toLowerCase().includes(cleanQ) ||
      b.category.toLowerCase().includes(cleanQ)
  ).slice(0, limit);
}
