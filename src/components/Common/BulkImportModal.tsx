import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import {
  downloadBookExcelTemplate,
  downloadBookCsvTemplate,
  downloadMemberExcelTemplate,
  downloadMemberCsvTemplate,
  BOOK_CSV_HEADERS,
  BOOK_CSV_SAMPLE_ROWS,
  MEMBER_CSV_HEADERS,
  MEMBER_CSV_SAMPLE_ROWS,
  parseBooksFromSpreadsheet,
  parseMembersFromSpreadsheet
} from '../../utils/csvTemplates';
import { Book, Member } from '../../types/library';

interface BulkImportModalProps {
  type: 'books' | 'members';
  booksCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onImportBooks?: (books: Book[]) => void;
  onImportMembers?: (members: Member[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  type,
  booksCount = 0,
  isOpen,
  onClose,
  onImportBooks,
  onImportMembers,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'upload'>('upload');
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{
    validItems: (Book | Member)[];
    errors: { rowNumber: number; reason: string }[];
  }>({ validItems: [], errors: [] });
  const [hasCopiedSample, setHasCopiedSample] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isBook = type === 'books';
  const title = isBook
    ? 'Impor Massal Buku (Excel .xlsx / CSV)'
    : 'Impor Massal Anggota (Excel .xlsx / CSV)';
  const headers = isBook ? BOOK_CSV_HEADERS : MEMBER_CSV_HEADERS;
  const sampleRows = isBook ? BOOK_CSV_SAMPLE_ROWS : MEMBER_CSV_SAMPLE_ROWS;

  const handleDownloadExcel = () => {
    if (isBook) {
      downloadBookExcelTemplate();
    } else {
      downloadMemberExcelTemplate();
    }
  };

  const handleDownloadCsv = () => {
    if (isBook) {
      downloadBookCsvTemplate();
    } else {
      downloadMemberCsvTemplate();
    }
  };

  const handleCopySample = () => {
    const raw = [
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');
    navigator.clipboard.writeText(raw);
    setHasCopiedSample(true);
    setTimeout(() => setHasCopiedSample(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (!buffer) return;

      if (isBook) {
        const { validBooks, errorRows } = parseBooksFromSpreadsheet(buffer, booksCount);
        setParsedPreview({ validItems: validBooks, errors: errorRows });
      } else {
        const { validMembers, errorRows } = parseMembersFromSpreadsheet(buffer);
        setParsedPreview({ validItems: validMembers, errors: errorRows });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedPreview({ validItems: [], errors: [] });
      return;
    }
    if (isBook) {
      const { validBooks, errorRows } = parseBooksFromSpreadsheet(text, booksCount);
      setParsedPreview({ validItems: validBooks, errors: errorRows });
    } else {
      const { validMembers, errorRows } = parseMembersFromSpreadsheet(text);
      setParsedPreview({ validItems: validMembers, errors: errorRows });
    }
  };

  const handleExecuteImport = () => {
    if (parsedPreview.validItems.length === 0) return;
    setIsProcessing(true);

    if (isBook && onImportBooks) {
      onImportBooks(parsedPreview.validItems as Book[]);
    } else if (!isBook && onImportMembers) {
      onImportMembers(parsedPreview.validItems as Member[]);
    }

    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Mendukung file Microsoft Excel (.xlsx / .xls) dan CSV resmi perpustakaan MA Roudlotul Jadid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>
              1. Unggah File Excel / CSV {parsedPreview.validItems.length > 0 && `(${parsedPreview.validItems.length} Siap)`}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'template'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Unduh Template & Format Kolom</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5">
          {/* TAB 1: UPLOAD & IMPORT */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Quick Template Download Reminder */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Belum punya format file yang sesuai?</span>
                    <span className="text-slate-600 text-[11px]">
                      Unduh template resmi kami agar seluruh kolom terbaca sempurna saat diunggah.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadExcel}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <span>.CSV</span>
                  </button>
                </div>
              </div>

              {/* File upload drag-and-drop or select box */}
              <div className="border-2 border-dashed border-emerald-400 hover:border-emerald-600 rounded-2xl p-6 bg-gradient-to-b from-emerald-50/20 to-slate-50/50 text-center transition-all relative group cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {fileName ? <FileCheck className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {fileName ? fileName : 'Klik di sini atau tarik file Excel / CSV Anda'}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Format didukung: <b>.XLSX</b> (Microsoft Excel asli), <b>.XLS</b>, atau <b>.CSV</b>
                    </span>
                  </div>
                  {fileName && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> File Terbaca & Diproses
                    </span>
                  )}
                </div>
              </div>

              {/* Paste Text Alternate Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Atau Tempel (Paste) Salinan Baris dari Excel / Spreadsheet:
                  </label>
                  {(rawText || fileName) && (
                    <button
                      onClick={() => {
                        setRawText('');
                        setFileName('');
                        setParsedPreview({ validItems: [], errors: [] });
                      }}
                      className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Kosongkan</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Anda juga dapat menyalin (copy) beberapa baris langsung dari tabel Excel dan menempelkannya di sini..."
                  className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Parsing Results & Status */}
              {(fileName || rawText.trim()) && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <b>{parsedPreview.validItems.length}</b> data berhasil terbaca dan siap diimpor
                      </span>
                      {parsedPreview.errors.length > 0 && (
                        <span className="flex items-center gap-1.5 text-rose-600">
                          <AlertCircle className="w-4 h-4" />
                          <b>{parsedPreview.errors.length}</b> baris bermasalah dilewati
                        </span>
                      )}
                    </div>

                    <button
                      disabled={parsedPreview.validItems.length === 0 || isProcessing}
                      onClick={handleExecuteImport}
                      className={`px-4 py-2 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 ${
                        parsedPreview.validItems.length === 0 || isProcessing
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/30'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isProcessing
                          ? 'Menyimpan...'
                          : `Impor ${parsedPreview.validItems.length} Data Sekarang`}
                      </span>
                    </button>
                  </div>

                  {/* Errors display */}
                  {parsedPreview.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-800">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Beberapa baris dilewati karena format tidak lengkap:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {parsedPreview.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>
                            Baris #{err.rowNumber}: {err.reason}
                          </li>
                        ))}
                        {parsedPreview.errors.length > 5 && (
                          <li>Dan {parsedPreview.errors.length - 5} baris lainnya...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Parsed Preview Table */}
                  {parsedPreview.validItems.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Pratinjau Data yang Terbaca ({parsedPreview.validItems.length} baris):
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Format valid & siap masuk database
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                            {isBook ? (
                              <tr>
                                <th className="p-2.5">Kode Buku</th>
                                <th className="p-2.5">Judul Buku</th>
                                <th className="p-2.5">Pengarang</th>
                                <th className="p-2.5">Kategori & Rak</th>
                                <th className="p-2.5 text-center">Eksemplar</th>
                                <th className="p-2.5">Kondisi</th>
                              </tr>
                            ) : (
                              <tr>
                                <th className="p-2.5">NISN/NIP</th>
                                <th className="p-2.5">Nama Lengkap</th>
                                <th className="p-2.5">Peran & Kelas</th>
                                <th className="p-2.5">No. Kontak</th>
                                <th className="p-2.5 text-center">Status</th>
                              </tr>
                            )}
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px] bg-white">
                            {parsedPreview.validItems.slice(0, 25).map((item, idx) => {
                              if (isBook) {
                                const b = item as Book;
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-2 font-mono text-slate-700 font-bold">
                                      {b.code}
                                    </td>
                                    <td className="p-2 font-semibold text-slate-900 max-w-xs truncate">
                                      {b.title}
                                    </td>
                                    <td className="p-2 text-slate-600">{b.author}</td>
                                    <td className="p-2 text-slate-600">
                                      {b.category} • {b.rack}
                                    </td>
                                    <td className="p-2 text-center font-bold text-emerald-700">
                                      {b.totalCopies} eks
                                    </td>
                                    <td className="p-2">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-semibold">
                                        {b.condition}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              } else {
                                const m = item as Member;
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-2 font-mono font-bold text-slate-800">
                                      {m.nisn_nip}
                                    </td>
                                    <td className="p-2 font-semibold text-slate-900">
                                      {m.name}
                                    </td>
                                    <td className="p-2 text-slate-600">
                                      <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-1.5 font-semibold">
                                        {m.role}
                                      </span>
                                      {m.classOrDept}
                                    </td>
                                    <td className="p-2 text-slate-600">{m.phone}</td>
                                    <td className="p-2 text-center">
                                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                        {m.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              }
                            })}
                          </tbody>
                        </table>
                      </div>
                      {parsedPreview.validItems.length > 25 && (
                        <p className="text-[11px] text-slate-400 text-center">
                          Menampilkan 25 dari total {parsedPreview.validItems.length} baris data yang siap diimpor.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOWNLOAD TEMPLATES & EXPLANATION */}
          {activeTab === 'template' && (
            <div className="space-y-5">
              {/* Call to action download box */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-700" /> Format Resmi MA Roudlotul Jadid
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isBook
                      ? 'File Template Spreadsheet Tambah Koleksi Buku'
                      : 'File Template Spreadsheet Tambah Data Anggota'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl">
                    Tersedia dalam format Microsoft Excel (.xlsx) dengan kolom yang sudah diatur rapi, atau format CSV standar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadExcel}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
                    title="Unduh versi CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV (.csv)</span>
                  </button>

                  <button
                    onClick={handleCopySample}
                    className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
                    title="Salin contoh teks"
                  >
                    {hasCopiedSample ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h5 className="font-bold text-xs text-slate-800">Unduh & Buka Template</h5>
                  <p className="text-[11px] text-slate-500">
                    Buka file <b>.xlsx</b> di Microsoft Excel atau Google Sheets. Jangan hapus baris pertama judul kolom.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h5 className="font-bold text-xs text-slate-800">Isi Data Buku / Anggota</h5>
                  <p className="text-[11px] text-slate-500">
                    Masukkan data ke baris 2 dan seterusnya. Sistem memiliki auto-matching pintar jika posisi kolom bergeser.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h5 className="font-bold text-xs text-slate-800">Unggah File & Simpan</h5>
                  <p className="text-[11px] text-slate-500">
                    Pilih file yang sudah disimpan di Excel. Sistem langsung membaca file .xlsx dan menambahkan ke katalog!
                  </p>
                </div>
              </div>

              {/* Sample Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Daftar Kolom & Contoh Pengisian Template:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Total {headers.length} kolom standar
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        {headers.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 border-l border-slate-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] bg-white">
                      {sampleRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 border-l border-slate-100 text-slate-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Next step button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Lanjut ke Unggah File</span>
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'template' ? (
              <span>Template .xlsx resmi kompatibel dengan semua versi Microsoft Excel & Google Sheets.</span>
            ) : (
              <span>Sistem membaca file Excel .xlsx & CSV secara otomatis.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Tutup
            </button>
            {activeTab === 'upload' && parsedPreview.validItems.length > 0 && (
              <button
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Impor {parsedPreview.validItems.length} Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
