import * as XLSX from 'xlsx';
import { Book, BookCategory, BookCondition, BookSource, Member, MemberRole, MemberStatus } from '../types/library';

// Helper to trigger browser download for Blobs
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to trigger browser CSV download with UTF-8 BOM
export function downloadFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  downloadBlob(filename, blob);
}

// ----------------------------------------------------
// TEMPLATE DATA BUKU
// ----------------------------------------------------
export const BOOK_CSV_HEADERS = [
  'Judul Buku',
  'Pengarang',
  'Penerbit',
  'Tahun Terbit',
  'ISBN',
  'Kategori DDC',
  'Lokasi Rak',
  'Jumlah Eksemplar',
  'Kondisi',
  'Sumber Pengadaan',
  'Harga Satuan (Rp)',
  'Sinopsis Singkat'
];

export const BOOK_CSV_SAMPLE_ROWS = [
  [
    'Al-Qur\'an Hadis untuk MA Kelas XI (Kurikulum Merdeka)',
    'H. Ahmad Syamsuri, M.Ag.',
    'Direktorat KSKK Madrasah Kemenag RI',
    '2023',
    '978-623-654-120-4',
    '200 - Agama',
    'Rak A-01 (Madrasah)',
    '25',
    'Baik',
    'BOS',
    '65000',
    'Buku teks utama pembelajaran Al-Quran dan Hadis madrasah aliyah fase F.'
  ],
  [
    'Fikih Ibadah & Muamalah MA Kelas X',
    'Drs. M. Ridwan, M.Pd.I',
    'Toha Putra Semarang',
    '2022',
    '978-979-432-887-1',
    '200 - Agama',
    'Rak A-02 (Fikih)',
    '15',
    'Baik',
    'Pembelian Sekolah',
    '58000',
    'Pedoman fikih ibadah praktis, thaharah, shalat, zakat, dan muamalah kontemporer.'
  ],
  [
    'Matematika Tingkat Lanjut SMA/MA Kelas XI',
    'Dicki Susanto, dkk.',
    'Pusat Perbukuan Kemendikbudristek',
    '2023',
    '978-602-244-789-2',
    '500 - Sains Murni & Matematika',
    'Rak B-01 (Matematika)',
    '20',
    'Baik',
    'BOS',
    '72000',
    'Materi fungsi polinomial, matriks, transformasi geometri, dan kalkulus diferensial.'
  ],
  [
    'Negeri 5 Menara',
    'Ahmad Fuadi',
    'Gramedia Pustaka Utama',
    '2020',
    '978-979-22-4861-6',
    '800 - Kesusastraan & Fiksi',
    'Rak C-01 (Kesusastraan)',
    '8',
    'Baik',
    'Hibah/Donasi',
    '85000',
    'Novel inspiratif perjalanan santri di Pondok Madani memegang prinsip Man Jadda Wajada.'
  ]
];

// Unduh Excel (.xlsx) untuk Buku
export function downloadBookExcelTemplate(): void {
  const wsData = [BOOK_CSV_HEADERS, ...BOOK_CSV_SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 45 }, // Judul Buku
    { wch: 28 }, // Pengarang
    { wch: 32 }, // Penerbit
    { wch: 14 }, // Tahun
    { wch: 22 }, // ISBN
    { wch: 28 }, // Kategori
    { wch: 22 }, // Rak
    { wch: 18 }, // Jumlah
    { wch: 12 }, // Kondisi
    { wch: 20 }, // Sumber
    { wch: 18 }, // Harga
    { wch: 55 }, // Sinopsis
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Buku');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob('template_buku_MA_Roudlotul_Jadid.xlsx', blob);
}

// Unduh CSV (.csv) untuk Buku
export function downloadBookCsvTemplate(): void {
  const csvRows = [
    BOOK_CSV_HEADERS.join(','),
    ...BOOK_CSV_SAMPLE_ROWS.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    )
  ];
  downloadFile('template_buku_MA_Roudlotul_Jadid.csv', csvRows.join('\r\n'));
}

// ----------------------------------------------------
// TEMPLATE DATA ANGGOTA
// ----------------------------------------------------
export const MEMBER_CSV_HEADERS = [
  'NISN atau NIP',
  'Nama Lengkap',
  'Peran (Siswa/Guru/Staf)',
  'Kelas atau Jabatan',
  'Jenis Kelamin (L/P)',
  'No WhatsApp / HP',
  'Email',
  'Status (Aktif/Nonaktif)'
];

export const MEMBER_CSV_SAMPLE_ROWS = [
  [
    '0081234561',
    'Muhammad Izzuddin Al-Qassam',
    'Siswa',
    'X-A (Fase E)',
    'L',
    '0812-3456-7891',
    'izzuddin@siswa.belajar.id',
    'Aktif'
  ],
  [
    '0081234562',
    'Fatimah Azzahra Putri',
    'Siswa',
    'X-B (Fase E)',
    'P',
    '0813-8877-6655',
    'fatimah.putri@siswa.belajar.id',
    'Aktif'
  ],
  [
    '0072345671',
    'Rifqi Hidayatullah',
    'Siswa',
    'XI MIPA 1',
    'L',
    '0857-1122-9900',
    'rifqi.h@siswa.belajar.id',
    'Aktif'
  ],
  [
    '19850314 201001 1 012',
    'Ust. M. Choirul Anam, S.Pd.I',
    'Guru',
    'Guru Fikih & Ushul Fikih',
    'L',
    '0821-9988-7711',
    'choirul.anam@kemenag.go.id',
    'Aktif'
  ],
  [
    '19900822 201402 2 005',
    'Ustdz. Nur Laili, S.Hum',
    'Guru',
    'Guru Bahasa Arab',
    'P',
    '0819-2233-4455',
    'nur.laili@kemenag.go.id',
    'Aktif'
  ],
  [
    '19871105 201201 1 008',
    'Ahmad Fauzi, S.Kom',
    'Staf',
    'Staf IT & Tata Usaha',
    'L',
    '0812-6677-8899',
    'fauzi.tu@gmail.com',
    'Aktif'
  ]
];

// Unduh Excel (.xlsx) untuk Anggota
export function downloadMemberExcelTemplate(): void {
  const wsData = [MEMBER_CSV_HEADERS, ...MEMBER_CSV_SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 25 }, // NISN/NIP
    { wch: 32 }, // Nama
    { wch: 22 }, // Peran
    { wch: 24 }, // Kelas/Jabatan
    { wch: 18 }, // Gender
    { wch: 20 }, // No WA
    { wch: 30 }, // Email
    { wch: 20 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Anggota');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob('template_anggota_MA_Roudlotul_Jadid.xlsx', blob);
}

// Unduh CSV (.csv) untuk Anggota
export function downloadMemberCsvTemplate(): void {
  const csvRows = [
    MEMBER_CSV_HEADERS.join(','),
    ...MEMBER_CSV_SAMPLE_ROWS.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    )
  ];
  downloadFile('template_anggota_MA_Roudlotul_Jadid.csv', csvRows.join('\r\n'));
}

// ----------------------------------------------------
// UNIVERSAL FILE PARSER (XLSX, XLS, CSV, TSV)
// ----------------------------------------------------

/**
 * Parses raw ArrayBuffer (from file upload) or plain string (from paste)
 * into a clean 2D string array. Works seamlessly with:
 * - Microsoft Excel .xlsx / .xls
 * - CSV files (comma, semicolon, or tab-delimited, with or without quotes)
 * - Plain text pastes
 */
export function parseSheetToRawMatrix(input: ArrayBuffer | string): string[][] {
  try {
    let wb: XLSX.WorkBook;

    if (typeof input === 'string') {
      const cleanText = input.replace(/^\uFEFF/, '').trim();
      if (!cleanText) return [];
      wb = XLSX.read(cleanText, { type: 'string', raw: false });
    } else {
      const uint8 = new Uint8Array(input);
      wb = XLSX.read(uint8, { type: 'array', raw: false });
    }

    if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
      return [];
    }

    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const data: any[][] = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });

    // Convert everything to string and strip empty trailing rows
    return data
      .map((row) =>
        (Array.isArray(row) ? row : [row]).map((cell) =>
          cell !== null && cell !== undefined ? String(cell).trim() : ''
        )
      )
      .filter((row) => row.some((c) => c.length > 0));
  } catch (err) {
    console.error('Failed to parse spreadsheet with XLSX:', err);
    // Fallback simple line-by-line parser for text
    if (typeof input === 'string') {
      return parseCsvRows(input);
    }
    return [];
  }
}

// Fallback CSV text line parser
export function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if ((char === ',' || char === ';' || char === '\t') && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    if (row.length > 0 && row.some((c) => c.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

// Normalize header string for keyword matching
function normalizeHeader(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ----------------------------------------------------
// SMART BOOK PARSING (WITH FLEXIBLE COLUMN MAPPING)
// ----------------------------------------------------
export function parseBooksFromSpreadsheet(
  input: ArrayBuffer | string,
  startCount: number
): { validBooks: Book[]; errorRows: { rowNumber: number; reason: string }[] } {
  const rows = parseSheetToRawMatrix(input);

  if (rows.length === 0) {
    return {
      validBooks: [],
      errorRows: [{ rowNumber: 1, reason: 'File kosong atau tidak berisi data tabel.' }]
    };
  }

  // Look for header row in first 3 rows
  let headerIndex = -1;
  const colMap = {
    title: -1,
    author: -1,
    publisher: -1,
    year: -1,
    isbn: -1,
    category: -1,
    rack: -1,
    copies: -1,
    condition: -1,
    source: -1,
    price: -1,
    synopsis: -1,
  };

  for (let r = 0; r < Math.min(3, rows.length); r++) {
    const row = rows[r].map(normalizeHeader);
    const hasTitle = row.some((c) => c.includes('judul') || c.includes('title') || c.includes('namabuku'));
    if (hasTitle) {
      headerIndex = r;
      row.forEach((col, idx) => {
        if (col.includes('judul') || col.includes('title') || col.includes('namabuku')) colMap.title = idx;
        else if (col.includes('pengarang') || col.includes('penulis') || col.includes('author')) colMap.author = idx;
        else if (col.includes('penerbit') || col.includes('publisher')) colMap.publisher = idx;
        else if (col.includes('tahun') || col.includes('year') || col.includes('terbit')) colMap.year = idx;
        else if (col.includes('isbn') || col.includes('issn')) colMap.isbn = idx;
        else if (col.includes('kategori') || col.includes('category') || col.includes('ddc') || col.includes('klasifikasi')) colMap.category = idx;
        else if (col.includes('rak') || col.includes('lokasi') || col.includes('shelf') || col.includes('rack')) colMap.rack = idx;
        else if (col.includes('eksemplar') || col.includes('jumlah') || col.includes('copies') || col.includes('stok') || col.includes('qty')) colMap.copies = idx;
        else if (col.includes('kondisi') || col.includes('condition')) colMap.condition = idx;
        else if (col.includes('sumber') || col.includes('source') || col.includes('dana')) colMap.source = idx;
        else if (col.includes('harga') || col.includes('price') || col.includes('biaya')) colMap.price = idx;
        else if (col.includes('sinopsis') || col.includes('ringkasan') || col.includes('deskripsi') || col.includes('catatan') || col.includes('keterangan')) colMap.synopsis = idx;
      });
      break;
    }
  }

  // Fallback if no header row recognized: assume standard 0-11 index
  if (headerIndex === -1) {
    // If first row looks like header anyway
    const firstRowFirstCell = normalizeHeader(rows[0][0] || '');
    if (firstRowFirstCell.includes('judul') || firstRowFirstCell.includes('buku') || firstRowFirstCell.includes('book')) {
      headerIndex = 0;
    }
    colMap.title = 0;
    colMap.author = 1;
    colMap.publisher = 2;
    colMap.year = 3;
    colMap.isbn = 4;
    colMap.category = 5;
    colMap.rack = 6;
    colMap.copies = 7;
    colMap.condition = 8;
    colMap.source = 9;
    colMap.price = 10;
    colMap.synopsis = 11;
  }

  const validBooks: Book[] = [];
  const errorRows: { rowNumber: number; reason: string }[] = [];
  const currentYear = new Date().getFullYear();

  const startIdx = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let idx = startIdx; idx < rows.length; idx++) {
    const r = rows[idx];
    const rowNum = idx + 1;

    // Helper cell getter
    const getCell = (colIdx: number) => (colIdx >= 0 && colIdx < r.length ? r[colIdx]?.trim() || '' : '');

    const title = getCell(colMap.title);
    if (!title) {
      // If entire row is empty, quietly ignore
      const hasAny = r.some((c) => c && c.trim().length > 0);
      if (hasAny) {
        errorRows.push({ rowNumber: rowNum, reason: 'Judul buku kosong (wajib diisi).' });
      }
      continue;
    }

    const author = getCell(colMap.author) || 'Tim Penulis';
    const publisher = getCell(colMap.publisher) || 'Penerbit Madrasah';
    
    // Parse year
    const rawYear = getCell(colMap.year);
    const parsedYear = parseInt(rawYear.replace(/[^0-9]/g, '')) || currentYear;
    const publishYear = parsedYear >= 1900 && parsedYear <= currentYear + 2 ? parsedYear : currentYear;

    const isbn = getCell(colMap.isbn) || '-';

    // Parse category
    let rawCategory = getCell(colMap.category);
    let category: BookCategory = '200 - Agama';
    if (rawCategory) {
      if (rawCategory.includes('200') || rawCategory.toLowerCase().includes('agama') || rawCategory.toLowerCase().includes('islam')) {
        category = '200 - Agama';
      } else if (rawCategory.includes('500') || rawCategory.toLowerCase().includes('sains') || rawCategory.toLowerCase().includes('matematika')) {
        category = '500 - Sains Murni & Matematika';
      } else if (rawCategory.includes('800') || rawCategory.toLowerCase().includes('sastra') || rawCategory.toLowerCase().includes('fiksi') || rawCategory.toLowerCase().includes('novel')) {
        category = '800 - Kesusastraan & Fiksi';
      } else if (rawCategory.includes('300') || rawCategory.toLowerCase().includes('sosial')) {
        category = '300 - Ilmu Sosial';
      } else if (rawCategory.includes('400') || rawCategory.toLowerCase().includes('bahasa')) {
        category = '400 - Bahasa';
      } else if (rawCategory.includes('600') || rawCategory.toLowerCase().includes('teknologi')) {
        category = '600 - Teknologi & Terapan';
      } else if (rawCategory.includes('700') || rawCategory.toLowerCase().includes('seni') || rawCategory.toLowerCase().includes('olahraga')) {
        category = '700 - Kesenian & Olahraga';
      } else if (rawCategory.includes('900') || rawCategory.toLowerCase().includes('sejarah') || rawCategory.toLowerCase().includes('geografi')) {
        category = '900 - Sejarah & Geografi';
      } else if (rawCategory.toLowerCase().includes('kamus') || rawCategory.toLowerCase().includes('referensi')) {
        category = 'Referensi & Kamus';
      } else if (rawCategory.toLowerCase().includes('merdeka') || rawCategory.toLowerCase().includes('kurikulum')) {
        category = 'Buku Teks Kurikulum Merdeka';
      } else if (rawCategory.includes('000') || rawCategory.toLowerCase().includes('komputer')) {
        category = '000 - Karya Umum & Komputer';
      } else if (rawCategory.includes('100') || rawCategory.toLowerCase().includes('filsafat')) {
        category = '100 - Filsafat & Psikologi';
      }
    }

    const rack = getCell(colMap.rack) || (category.startsWith('200') ? 'Rak A-01 (Agama)' : 'Rak B-01 (Umum)');
    
    // Parse copies
    const rawCopies = getCell(colMap.copies);
    const totalCopies = Math.max(1, parseInt(rawCopies.replace(/[^0-9]/g, '')) || 5);

    // Parse condition
    const rawCond = getCell(colMap.condition).toLowerCase();
    let condition: BookCondition = 'Baik';
    if (rawCond.includes('rusak berat')) condition = 'Rusak Berat';
    else if (rawCond.includes('rusak')) condition = 'Rusak Ringan';

    // Parse source
    const rawSource = getCell(colMap.source).toLowerCase();
    let source: BookSource = 'BOS';
    if (rawSource.includes('hibah') || rawSource.includes('donasi')) source = 'Hibah/Donasi';
    else if (rawSource.includes('kemendikbud') || rawSource.includes('kemenag')) source = 'Kemendikbud';
    else if (rawSource.includes('sekolah') || rawSource.includes('pembelian')) source = 'Pembelian Sekolah';

    // Parse price
    const rawPrice = getCell(colMap.price);
    const price = parseInt(rawPrice.replace(/[^0-9]/g, '')) || 65000;

    const synopsis = getCell(colMap.synopsis) || `Buku koleksi "${title}" di perpustakaan MA Roudlotul Jadid.`;

    const bookIdx = startCount + validBooks.length + 1;
    const code = `BK-${currentYear}-${String(bookIdx).padStart(3, '0')}`;
    const barcode = `899${currentYear}${String(bookIdx).padStart(4, '0')}`;

    // Auto Call Number
    const ddcCode = category.startsWith('200') ? '297' : category.startsWith('500') ? '510' : category.startsWith('800') ? '813' : '020';
    const authorWords = author.trim().split(' ').filter(Boolean);
    const authorTag = authorWords.length > 0 ? authorWords[authorWords.length - 1].slice(0, 3).toUpperCase() : 'XXX';
    const titleLetter = title.trim().charAt(0).toLowerCase();
    const callNumber = `${ddcCode} ${authorTag} ${titleLetter}`;

    const gradients = [
      'from-emerald-600 to-teal-800',
      'from-blue-600 to-indigo-800',
      'from-amber-600 to-orange-800',
      'from-purple-600 to-indigo-900',
      'from-rose-600 to-red-900',
      'from-teal-600 to-cyan-900'
    ];
    const coverGradient = gradients[validBooks.length % gradients.length];

    validBooks.push({
      id: `b-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      code,
      callNumber,
      barcode,
      isbn,
      title,
      author,
      publisher,
      publishYear,
      category,
      rack,
      totalCopies,
      availableCopies: totalCopies,
      condition,
      source,
      price,
      synopsis,
      coverGradient,
      addedDate: new Date().toISOString().split('T')[0],
    });
  }

  return { validBooks, errorRows };
}

// ----------------------------------------------------
// SMART MEMBER PARSING (WITH FLEXIBLE COLUMN MAPPING)
// ----------------------------------------------------
export function parseMembersFromSpreadsheet(
  input: ArrayBuffer | string
): { validMembers: Member[]; errorRows: { rowNumber: number; reason: string }[] } {
  const rows = parseSheetToRawMatrix(input);

  if (rows.length === 0) {
    return {
      validMembers: [],
      errorRows: [{ rowNumber: 1, reason: 'File kosong atau tidak berisi data tabel.' }]
    };
  }

  // Header detection
  let headerIndex = -1;
  const colMap = {
    nisn: -1,
    name: -1,
    role: -1,
    classOrDept: -1,
    gender: -1,
    phone: -1,
    email: -1,
    status: -1,
  };

  for (let r = 0; r < Math.min(3, rows.length); r++) {
    const row = rows[r].map(normalizeHeader);
    const hasNameOrNisn = row.some((c) => c.includes('nama') || c.includes('nisn') || c.includes('nip'));
    if (hasNameOrNisn) {
      headerIndex = r;
      row.forEach((col, idx) => {
        if (col.includes('nisn') || col.includes('nip') || col.includes('nik') || col.includes('nomorinduk') || col.includes('nis')) {
          if (colMap.nisn === -1) colMap.nisn = idx;
        } else if (col.includes('nama') || col.includes('name')) {
          if (colMap.name === -1) colMap.name = idx;
        } else if (col.includes('peran') || col.includes('role') || col.includes('tipe') || col.includes('statuskeanggotaan')) {
          if (colMap.role === -1) colMap.role = idx;
        } else if (col.includes('kelas') || col.includes('jabatan') || col.includes('jurusan') || col.includes('fase') || col.includes('bagian')) {
          if (colMap.classOrDept === -1) colMap.classOrDept = idx;
        } else if (col.includes('jeniskelamin') || col.includes('gender') || col.includes('jk') || col === 'lp' || col.includes('kelamin')) {
          if (colMap.gender === -1) colMap.gender = idx;
        } else if (col.includes('wa') || col.includes('hp') || col.includes('telepon') || col.includes('phone') || col.includes('kontak')) {
          if (colMap.phone === -1) colMap.phone = idx;
        } else if (col.includes('email') || col.includes('surel')) {
          if (colMap.email === -1) colMap.email = idx;
        } else if (col.includes('status') || col.includes('keaktifan')) {
          if (colMap.status === -1) colMap.status = idx;
        }
      });
      break;
    }
  }

  // Fallback if header not recognized
  if (headerIndex === -1) {
    colMap.nisn = 0;
    colMap.name = 1;
    colMap.role = 2;
    colMap.classOrDept = 3;
    colMap.gender = 4;
    colMap.phone = 5;
    colMap.email = 6;
    colMap.status = 7;
  }

  // Double check if name or nisn is missing, try defaults
  if (colMap.nisn === -1) colMap.nisn = 0;
  if (colMap.name === -1) colMap.name = colMap.nisn === 0 ? 1 : 0;

  const validMembers: Member[] = [];
  const errorRows: { rowNumber: number; reason: string }[] = [];
  const startIdx = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let idx = startIdx; idx < rows.length; idx++) {
    const r = rows[idx];
    const rowNum = idx + 1;

    const getCell = (colIdx: number) => (colIdx >= 0 && colIdx < r.length ? r[colIdx]?.trim() || '' : '');

    const nisn_nip = getCell(colMap.nisn);
    const name = getCell(colMap.name);

    if (!name && !nisn_nip) {
      // Empty row
      continue;
    }

    if (!name) {
      errorRows.push({ rowNumber: rowNum, reason: 'Nama lengkap wajib diisi.' });
      continue;
    }

    const finalNisn = nisn_nip || `GEN-${Date.now().toString().slice(-6)}${idx}`;

    // Role
    const rawRole = getCell(colMap.role).toLowerCase();
    let role: MemberRole = 'Siswa';
    if (rawRole.includes('guru') || rawRole.includes('ustadz') || rawRole.includes('pendidik') || rawRole.includes('pengajar')) {
      role = 'Guru';
    } else if (rawRole.includes('staf') || rawRole.includes('tu') || rawRole.includes('karyawan') || rawRole.includes('pegawai')) {
      role = 'Staf';
    }

    const classOrDept = getCell(colMap.classOrDept) || (role === 'Siswa' ? 'X MA' : role === 'Guru' ? 'Dewan Guru' : 'Tata Usaha');

    // Gender
    const rawGender = getCell(colMap.gender).toUpperCase();
    const gender: 'L' | 'P' = rawGender.startsWith('P') || rawGender.includes('WANITA') || rawGender.includes('PEREMPUAN') ? 'P' : 'L';

    const phone = getCell(colMap.phone) || '-';
    const email = getCell(colMap.email) || `${finalNisn.replace(/\s+/g, '')}@maroudlotuljadid.sch.id`;

    // Status
    const rawStatus = getCell(colMap.status).toLowerCase();
    let status: MemberStatus = 'Aktif';
    if (rawStatus.includes('non') || rawStatus.includes('tidak') || rawStatus.includes('pasif')) {
      status = 'Nonaktif';
    } else if (rawStatus.includes('tangguh') || rawStatus.includes('suspend')) {
      status = 'Ditangguhkan';
    } else if (rawStatus.includes('alumni') || rawStatus.includes('lulus')) {
      status = 'Alumni';
    } else if (rawStatus.includes('mutasi') || rawStatus.includes('pindah')) {
      status = 'Mutasi';
    }

    const avatarColors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-indigo-700',
      'bg-amber-600',
      'bg-rose-700',
      'bg-teal-700'
    ];
    const avatarColor = avatarColors[validMembers.length % avatarColors.length];

    validMembers.push({
      id: `mem-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      nisn_nip: finalNisn,
      name,
      role,
      classOrDept,
      phone,
      email,
      gender,
      status,
      avatarColor,
      joinDate: new Date().toISOString().split('T')[0],
    });
  }

  return { validMembers, errorRows };
}

// Backward compatibility alias functions
export function parseBooksFromCsv(
  csvText: string,
  startCount: number
): { validBooks: Book[]; errorRows: { rowNumber: number; reason: string }[] } {
  return parseBooksFromSpreadsheet(csvText, startCount);
}

export function parseMembersFromCsv(
  csvText: string
): { validMembers: Member[]; errorRows: { rowNumber: number; reason: string }[] } {
  return parseMembersFromSpreadsheet(csvText);
}
