/**
 * Google Apps Script (Code.gs) & Index.html Source Code Generator
 * Script ini dirancang khusus untuk Google Sheets sebagai database cloud
 * Aplikasi Sistem Perpustakaan Sekolah Digital MA Roudlotul Jadid.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT - SISTEM PERPUSTAKAAN DIGITAL MA ROUDLOTUL JADID
 * ==============================================================================
 * 
 * FUNGSI UTAMA:
 * 1. Database Google Sheets untuk Anggota, Buku & Stok, E-Book PDF, Sirkulasi, Kunjungan
 * 2. Mendukung 2 Mode Sekaligus:
 *    A. Mode REST API Web App (fetch GET & POST dari browser luar)
 *    B. Mode Native Apps Script (google.script.run saat dijalankan di script.google.com)
 *
 * CARA DEPLOY CEPAT KE GOOGLE SHEETS:
 * 1. Buat spreadsheet baru di https://sheet.new
 * 2. Klik menu 'Ekstensi' > 'Apps Script'
 * 3. Hapus kode bawaan di Code.gs, lalu paste seluruh kode ini
 * 4. (Opsional) Buat file HTML baru beri nama 'Index.html' dan paste kode Index.html
 * 5. Klik 'Deploy' (Terapkan) > 'New deployment' (Penerapan baru)
 *    - Type: 'Web app' (Aplikasi web)
 *    - Description: "Pustaka Digital v2.4"
 *    - Execute as: "Me" (Email Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 6. Klik 'Deploy' dan salin URL Web App (/exec).
 * ==============================================================================
 */

// Nama-nama Sheet Database
var SHEETS = {
  MEMBERS: 'ANGGOTA',
  BOOKS: 'KATALOG_BUKU',
  EBOOKS: 'EBOOK_PDF',
  LOANS: 'SIRKULASI_PINJAM',
  VISITORS: 'PRESENSI_KUNJUNGAN',
  SETTINGS: 'PENGATURAN'
};

/**
 * Handle HTTP GET Requests
 * Melayani:
 * - REST API (action=ping, action=getAll)
 * - Tampilan Web App HTML jika dibuka langsung di browser
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action;

    // 1. Endpoint REST Ping
    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Google Apps Script Backend Perpustakaan Aktif & Terhubung!',
        spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Endpoint REST Ambil Semua Data (getAll)
    if (action === 'getAll') {
      ensureAllSheetsExist();
      var allData = apiGetAll();
      return jsonResponse({
        status: 'success',
        message: 'Berhasil mengambil semua data dari Google Sheets',
        data: allData,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Render HTML Service jika diakses langsung di browser
    try {
      return HtmlService.createHtmlOutputFromFile('Index')
        .setTitle('PustakaDigital - Sistem Perpustakaan MA Roudlotul Jadid')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (errHtml) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var outputHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<title>Database Perpustakaan Digital</title>' +
        '<style>' +
        'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:32px;background:#f8fafc;color:#0f172a;max-width:800px;margin:auto;}' +
        '.card{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 6px -1px rgb(0 0 0/0.1);}' +
        'h1{color:#059669;margin-top:0;display:flex;align-items:center;gap:8px;font-size:22px;}' +
        '.badge{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;display:inline-block;margin-bottom:12px;}' +
        'pre{background:#0f172a;color:#38bdf8;padding:12px;border-radius:10px;overflow-x:auto;font-size:12px;}' +
        'a.button{background:#059669;color:#ffffff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;margin-top:12px;}' +
        '</style></head><body>' +
        '<div class="card">' +
        '<span class="badge">Google Apps Script Web App Aktif</span>' +
        '<h1>📚 Database Perpustakaan Digital MA Roudlotul Jadid</h1>' +
        '<p>Server backend Google Sheets berhasil terpasang dan siap menerima pertukaran data dari aplikasi perpustakaan.</p>' +
        '<p><strong>Spreadsheet Terhubung:</strong> ' + ss.getName() + '</p>' +
        '<p><a href="' + ss.getUrl() + '" target="_blank" class="button">Buka Spreadsheet di Google Sheets &rarr;</a></p>' +
        '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">' +
        '<p style="font-size:13px;color:#64748b;">Salin URL Web App ini dan masukkan ke menu <strong>Integrasi Google Apps Script</strong> di aplikasi:</p>' +
        '<pre>' + ScriptApp.getService().getUrl() + '</pre>' +
        '</div></body></html>';

      return HtmlService.createHtmlOutput(outputHtml)
        .setTitle('Backend Perpustakaan Aktif')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Terjadi kesalahan GET: ' + err.toString()
    });
  }
}

/**
 * Handle HTTP POST Requests (REST API)
 */
function doPost(e) {
  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload;
    try {
      payload = JSON.parse(contents);
    } catch (parseErr) {
      payload = {};
    }

    var action = payload.action || 'syncAll';

    // 1. Setup / Inisialisasi Sheet Baru
    if (action === 'setup') {
      ensureAllSheetsExist();
      return jsonResponse({
        status: 'success',
        message: 'Inisialisasi 6 Sheet Database Perpustakaan Berhasil!',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Sinkronisasi Penuh Semua Data (Push dari Web App ke Google Sheets)
    if (action === 'syncAll') {
      var syncRes = apiSyncAll(payload);
      return jsonResponse(syncRes);
    }

    // 3. Simpan Anggota Spesifik
    if (action === 'saveMembers' && payload.members) {
      ensureAllSheetsExist();
      var mCount = saveMembersSheet(payload.members);
      return jsonResponse({ status: 'success', count: mCount, message: 'Data anggota berhasil disimpan.' });
    }

    // 4. Simpan Buku Spesifik
    if (action === 'saveBooks' && payload.books) {
      ensureAllSheetsExist();
      var bCount = saveBooksSheet(payload.books);
      return jsonResponse({ status: 'success', count: bCount, message: 'Katalog buku berhasil disimpan.' });
    }

    // 5. Simpan E-Book Spesifik
    if (action === 'saveEBooks' && payload.ebooks) {
      ensureAllSheetsExist();
      var ebCount = saveEBooksSheet(payload.ebooks);
      return jsonResponse({ status: 'success', count: ebCount, message: 'Koleksi e-book berhasil disimpan.' });
    }

    // 6. Simpan Sirkulasi Pinjam Spesifik
    if (action === 'saveLoans' && payload.loans) {
      ensureAllSheetsExist();
      var lCount = saveLoansSheet(payload.loans);
      return jsonResponse({ status: 'success', count: lCount, message: 'Sirkulasi peminjaman berhasil disimpan.' });
    }

    // 7. Simpan Presensi Kunjungan Spesifik
    if (action === 'saveVisitors' && payload.visitors) {
      ensureAllSheetsExist();
      var vCount = saveVisitorsSheet(payload.visitors);
      return jsonResponse({ status: 'success', count: vCount, message: 'Data kunjungan berhasil disimpan.' });
    }

    return jsonResponse({
      status: 'error',
      message: 'Aksi POST tidak dikenal: ' + action
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Kesalahan server Apps Script: ' + err.toString()
    });
  }
}

/**
 * ==============================================================================
 * NATIVE GOOGLE APPS SCRIPT API (Dapat dipanggil via google.script.run & REST)
 * ==============================================================================
 */

function apiPing() {
  return {
    status: 'success',
    message: 'Google Apps Script Native Connected!',
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    timestamp: new Date().toISOString()
  };
}

function apiGetAll() {
  ensureAllSheetsExist();
  return {
    members: getSheetDataAsObjects(SHEETS.MEMBERS),
    books: getSheetDataAsObjects(SHEETS.BOOKS),
    ebooks: getSheetDataAsObjects(SHEETS.EBOOKS),
    loans: getSheetDataAsObjects(SHEETS.LOANS),
    visitors: getSheetDataAsObjects(SHEETS.VISITORS),
    settings: getSettingsObject()
  };
}

function apiSyncAll(payload) {
  ensureAllSheetsExist();
  var stats = {
    membersCount: 0,
    booksCount: 0,
    ebooksCount: 0,
    loansCount: 0,
    visitorsCount: 0
  };

  if (payload.members && Array.isArray(payload.members)) {
    stats.membersCount = saveMembersSheet(payload.members);
  }
  if (payload.books && Array.isArray(payload.books)) {
    stats.booksCount = saveBooksSheet(payload.books);
  }
  if (payload.ebooks && Array.isArray(payload.ebooks)) {
    stats.ebooksCount = saveEBooksSheet(payload.ebooks);
  }
  if (payload.loans && Array.isArray(payload.loans)) {
    stats.loansCount = saveLoansSheet(payload.loans);
  }
  if (payload.visitors && Array.isArray(payload.visitors)) {
    stats.visitorsCount = saveVisitorsSheet(payload.visitors);
  }
  if (payload.settings) {
    saveSettingsSheet(payload.settings);
  }

  return {
    status: 'success',
    message: 'Sinkronisasi berhasil! Semua data tersimpan aman di Google Sheets.',
    stats: stats,
    timestamp: new Date().toISOString()
  };
}

function apiSaveMembers(members) {
  ensureAllSheetsExist();
  return { status: 'success', count: saveMembersSheet(members) };
}

function apiSaveBooks(books) {
  ensureAllSheetsExist();
  return { status: 'success', count: saveBooksSheet(books) };
}

function apiSaveEBooks(ebooks) {
  ensureAllSheetsExist();
  return { status: 'success', count: saveEBooksSheet(ebooks) };
}

function apiSaveLoans(loans) {
  ensureAllSheetsExist();
  return { status: 'success', count: saveLoansSheet(loans) };
}

function apiSaveVisitors(visitors) {
  ensureAllSheetsExist();
  return { status: 'success', count: saveVisitorsSheet(visitors) };
}

function apiSaveSettings(settings) {
  ensureAllSheetsExist();
  saveSettingsSheet(settings);
  return { status: 'success' };
}

/**
 * ==============================================================================
 * HELPER: INISIALISASI & FORMATTING SHEET
 * ==============================================================================
 */
function ensureAllSheetsExist() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet ANGGOTA
  var mTitles = ['ID Anggota', 'Nama Lengkap', 'Tipe/Kategori', 'Kelas / Jabatan', 'Kontak / WA', 'Status', 'Terdaftar Sejak', 'URL Foto'];
  setupSingleSheet(ss, SHEETS.MEMBERS, mTitles, '#10b981');

  // 2. Sheet KATALOG_BUKU
  var bTitles = ['Barcode / ID', 'Judul Buku', 'Pengarang', 'Penerbit', 'Tahun', 'Kategori', 'Klasifikasi DDC', 'ISBN', 'Lokasi Rak', 'Total Stok', 'Stok Tersedia', 'Deskripsi', 'Tanggal Input'];
  setupSingleSheet(ss, SHEETS.BOOKS, bTitles, '#059669');

  // 3. Sheet EBOOK_PDF
  var ebTitles = ['ID E-Book', 'Judul E-Book', 'Pengarang', 'Penerbit', 'Tahun Terbit', 'Kategori', 'Ukuran File', 'Format', 'File / Link E-Book', 'Dibaca Kali', 'Deskripsi Singkat', 'Tanggal Unggah'];
  setupSingleSheet(ss, SHEETS.EBOOKS, ebTitles, '#0284c7');

  // 4. Sheet SIRKULASI_PINJAM
  var lTitles = ['ID Peminjaman', 'ID Buku', 'Judul Buku', 'ID Anggota', 'Nama Peminjam', 'Tanggal Pinjam', 'Jatuh Tempo', 'Tanggal Kembali', 'Status', 'Denda (Rp)', 'Tahap Siklus', 'Total Perpanjangan', 'Durasi (Hari)', 'Catatan'];
  setupSingleSheet(ss, SHEETS.LOANS, lTitles, '#8b5cf6');

  // 5. Sheet PRESENSI_KUNJUNGAN
  var vTitles = ['ID Kunjungan', 'ID Anggota', 'Nama Pengunjung', 'Kategori', 'Kelas / Unit', 'Tanggal', 'Waktu Masuk', 'Keperluan', 'Catatan'];
  setupSingleSheet(ss, SHEETS.VISITORS, vTitles, '#d97706');

  // 6. Sheet PENGATURAN
  var sTitles = ['Kunci Pengaturan (Key)', 'Nilai (Value)', 'Keterangan'];
  setupSingleSheet(ss, SHEETS.SETTINGS, sTitles, '#475569');

  // Hapus Sheet bawaan 'Sheet1' jika ada dan sheet lain sudah terbentuk
  var sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (e) {}
  }
}

function setupSingleSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor || '#0f172a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Arial');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  return sheet;
}

/**
 * ==============================================================================
 * PENYIMPANAN DATA KE GOOGLE SHEETS
 * ==============================================================================
 */

// 1. Simpan Anggota
function saveMembersSheet(members) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.MEMBERS);
  if (!sheet) return 0;

  clearDataRows(sheet);
  if (members.length === 0) return 0;

  var rows = members.map(function(m) {
    return [
      m.id || '',
      m.name || '',
      m.role || m.type || 'Siswa',
      m.classOrDept || m.classGrade || '',
      m.phone || m.contact || '',
      m.status || 'Aktif',
      m.joinDate || m.registeredDate || '',
      m.photoUrl || ''
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

// 2. Simpan Katalog Buku & Stok
function saveBooksSheet(books) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.BOOKS);
  if (!sheet) return 0;

  clearDataRows(sheet);
  if (books.length === 0) return 0;

  var rows = books.map(function(b) {
    return [
      b.id || b.barcode || b.code || '',
      b.title || '',
      b.author || '',
      b.publisher || '',
      b.publishYear || b.year || '',
      b.category || '',
      b.callNumber || '',
      b.isbn || '',
      b.rack || b.shelfLocation || '',
      b.totalCopies || 1,
      b.availableCopies !== undefined ? b.availableCopies : 1,
      (b.synopsis || b.description || '').substring(0, 500),
      b.addedDate || b.entryDate || ''
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

// 3. Simpan Koleksi E-Book PDF
function saveEBooksSheet(ebooks) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.EBOOKS);
  if (!sheet) return 0;

  clearDataRows(sheet);
  if (ebooks.length === 0) return 0;

  var rows = ebooks.map(function(eb) {
    var fileDataPreview = eb.pdfFileName ? ('PDF File: ' + eb.pdfFileName) : (eb.fileUrl || eb.coverUrl || '');
    return [
      eb.id || eb.code || '',
      eb.title || '',
      eb.author || '',
      eb.publisher || '',
      eb.publishYear || eb.year || '',
      eb.category || '',
      eb.fileSize || (eb.pdfFileSize ? Math.round(eb.pdfFileSize / 1024) + ' KB' : ''),
      eb.fileType || 'pdf_upload',
      fileDataPreview,
      (eb.readsCount !== undefined ? eb.readsCount : (eb.readCount || 0)),
      (eb.synopsis || eb.description || '').substring(0, 300),
      eb.addedDate || eb.uploadDate || ''
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

// 4. Simpan Sirkulasi Pinjam & Siklus
function saveLoansSheet(loans) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.LOANS);
  if (!sheet) return 0;

  clearDataRows(sheet);
  if (loans.length === 0) return 0;

  var rows = loans.map(function(l) {
    return [
      l.id || l.transactionCode || '',
      l.bookId || '',
      l.bookTitle || '',
      l.memberId || '',
      l.memberName || '',
      l.borrowDate || '',
      l.dueDate || '',
      l.returnDate || '',
      l.status || '',
      l.fineAmount || 0,
      l.cycleStatus || '',
      l.renewalCount || 0,
      l.cycleDurationDays || 0,
      l.notes || ''
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

// 5. Simpan Presensi Kunjungan
function saveVisitorsSheet(visitors) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.VISITORS);
  if (!sheet) return 0;

  clearDataRows(sheet);
  if (visitors.length === 0) return 0;

  var rows = visitors.map(function(v) {
    return [
      v.id || '',
      v.memberId || '',
      v.name || '',
      v.role || v.type || '',
      v.classOrDept || v.classGrade || '',
      v.date || '',
      v.time || '',
      v.purpose || '',
      v.notes || ''
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

// 6. Simpan Pengaturan
function saveSettingsSheet(settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return;

  clearDataRows(sheet);
  var rows = [
    ['libraryName', settings.libraryName || '', 'Nama Resmi Lembaga Perpustakaan'],
    ['schoolName', settings.schoolName || '', 'Nama Sekolah / Madrasah Induk'],
    ['maxBorrowDaysStudent', settings.maxBorrowDaysStudent || 7, 'Batas Maksimal Hari Pinjam Siswa'],
    ['maxBooksStudent', settings.maxBooksStudent || 3, 'Batas Maksimal Buku Siswa'],
    ['finePerDay', settings.finePerDay || 2000, 'Tarif Denda Keterlambatan per Hari (Rp)'],
    ['address', settings.address || '', 'Alamat Lengkap Perpustakaan'],
    ['headLibrarian', settings.headLibrarian || '', 'Nama Kepala Perpustakaan & NIP'],
    ['lastSyncDate', new Date().toISOString(), 'Waktu Sinkronisasi Terakhir']
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * ==============================================================================
 * PENGAMBILAN DATA DARI GOOGLE SHEETS
 * ==============================================================================
 */

function getSheetDataAsObjects(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var results = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      obj[key] = row[c];
    }
    results.push(obj);
  }
  return results;
}

function getSettingsObject() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return {};

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};

  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var settings = {};
  for (var i = 0; i < values.length; i++) {
    var key = values[i][0];
    var val = values[i][1];
    if (key) {
      settings[key] = val;
    }
  }
  return settings;
}

function clearDataRows(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * File HTML mandiri (Index.html) yang dapat dibuat di Google Apps Script editor
 * untuk menjalankan aplikasi langsung di dalam Google Apps Script Web App!
 */
export const GOOGLE_APPS_SCRIPT_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PustakaDigital - Sistem Perpustakaan Sekolah</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
    }
    #app-frame {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: #f8fafc;
      z-index: 50;
      transition: opacity 0.4s ease;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loader" class="loading-overlay">
    <div class="spinner"></div>
    <div style="font-weight: 600; font-size: 15px; color: #10b981;">PustakaDigital MA Roudlotul Jadid</div>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Memuat aplikasi di lingkungan Google Apps Script...</div>
  </div>

  <iframe
    id="app-frame"
    src="https://ais-pre-3jw3xkgnsn25yg2chayjme-483675790012.asia-northeast1.run.app"
    allow="clipboard-read; clipboard-write; camera;"
    title="Sistem Perpustakaan Sekolah"
  ></iframe>

  <script>
    // Sembunyikan loader saat frame selesai dimuat
    const frame = document.getElementById('app-frame');
    const loader = document.getElementById('loader');
    
    frame.addEventListener('load', function() {
      setTimeout(function() {
        if (loader) {
          loader.style.opacity = '0';
          setTimeout(function() { loader.style.display = 'none'; }, 400);
        }
      }, 500);
    });

    // Bridge komunikasi antara Google Apps Script dan Frame Aplikasi
    window.addEventListener('message', function(event) {
      if (!event.data || !event.data.type) return;

      if (event.data.type === 'GAS_PING' && typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            frame.contentWindow.postMessage({ type: 'GAS_PING_RESPONSE', data: res }, '*');
          })
          .apiPing();
      }

      if (event.data.type === 'GAS_SYNC_ALL' && typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            frame.contentWindow.postMessage({ type: 'GAS_SYNC_ALL_RESPONSE', data: res }, '*');
          })
          .apiSyncAll(event.data.payload);
      }
    });
  </script>
</body>
</html>
`;
