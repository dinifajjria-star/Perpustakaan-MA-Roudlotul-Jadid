import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Files,
  FileText,
  Trash2,
  CheckCircle2,
  Download,
  AlertCircle,
  Sparkles,
  Layers,
  Edit2
} from 'lucide-react';
import { EBook, EBookCategory, EBookGradeLevel } from '../../types/library';
import { generateCoverCanvasThumbnail, extractPdfFirstPage } from '../../utils/pdfThumbnail';
import { formatFileSize, savePdfToStorage } from '../../utils/pdfStorage';

interface BulkEBookUploadModalProps {
  existingTotalEBooks: number;
  onSaveBulk: (newEBooks: EBook[]) => void;
  onClose: () => void;
}

interface StagedEBook {
  id: string;
  tempFile?: File;
  code: string;
  title: string;
  author: string;
  publisher: string;
  publishYear: number;
  category: EBookCategory;
  gradeLevel: EBookGradeLevel;
  totalPages: number;
  fileSizeStr: string;
  fileSizeBytes: number;
  fileName: string;
  coverThumbnail: string;
  hasExtractedCover: boolean;
}

const CATEGORIES: EBookCategory[] = [
  'Buku Teks Kurikulum Merdeka',
  'Pendidikan Agama Islam & Fikih',
  'Al-Qur\'an & Hadis',
  'Akidah & Akhlak',
  'Sejarah Kebudayaan Islam (SKI)',
  'Bahasa Arab & Sastra',
  'Bahasa Indonesia & Literasi',
  'Sains Murni & Matematika',
  'Ilmu Sosial & Ekonomi',
  'Pengembangan Diri & Motivasi',
  'Karya Sastra & Novel Santri',
  'Teknologi & Komputer',
];

const GRADE_LEVELS: EBookGradeLevel[] = [
  'Kelas X',
  'Kelas XI',
  'Kelas XII',
  'Semua Tingkat / Umum',
  'Guru & Staf',
];

export const BulkEBookUploadModal: React.FC<BulkEBookUploadModalProps> = ({
  existingTotalEBooks,
  onSaveBulk,
  onClose,
}) => {
  const [stagedList, setStagedList] = useState<StagedEBook[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<EBookCategory>('Buku Teks Kurikulum Merdeka');
  const [bulkGrade, setBulkGrade] = useState<EBookGradeLevel>('Kelas X');
  const [csvPasteModalOpen, setCsvPasteModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intelligent category detector based on filename
  const detectCategory = (fileName: string): EBookCategory => {
    const fn = fileName.toLowerCase();
    if (fn.includes('fikih') || fn.includes('fiqih')) return 'Pendidikan Agama Islam & Fikih';
    if (fn.includes('quran') || fn.includes('qur\'an') || fn.includes('hadis') || fn.includes('hadits')) return 'Al-Qur\'an & Hadis';
    if (fn.includes('akidah') || fn.includes('akhlak')) return 'Akidah & Akhlak';
    if (fn.includes('ski') || fn.includes('sejarah kebudayaan islam')) return 'Sejarah Kebudayaan Islam (SKI)';
    if (fn.includes('arab')) return 'Bahasa Arab & Sastra';
    if (fn.includes('indonesia') || fn.includes('literasi') || fn.includes('cerpen')) return 'Bahasa Indonesia & Literasi';
    if (fn.includes('matematika') || fn.includes('fisika') || fn.includes('biologi') || fn.includes('kimia') || fn.includes('ipa') || fn.includes('sains')) {
      return 'Sains Murni & Matematika';
    }
    if (fn.includes('ekonomi') || fn.includes('geografi') || fn.includes('sosiologi') || fn.includes('ips') || fn.includes('sejarah')) {
      return 'Ilmu Sosial & Ekonomi';
    }
    if (fn.includes('komputer') || fn.includes('informatika') || fn.includes('coding') || fn.includes('teknologi')) {
      return 'Teknologi & Komputer';
    }
    if (fn.includes('novel') || fn.includes('santri') || fn.includes('pesantren')) {
      return 'Karya Sastra & Novel Santri';
    }
    return 'Buku Teks Kurikulum Merdeka';
  };

  // Intelligent grade detector
  const detectGradeLevel = (fileName: string): EBookGradeLevel => {
    const fn = fileName.toLowerCase();
    if (fn.includes('kelas 10') || fn.includes('kelas x') || fn.includes('_10') || fn.includes('-10')) return 'Kelas X';
    if (fn.includes('kelas 11') || fn.includes('kelas xi') || fn.includes('_11') || fn.includes('-11')) return 'Kelas XI';
    if (fn.includes('kelas 12') || fn.includes('kelas xii') || fn.includes('_12') || fn.includes('-12')) return 'Kelas XII';
    if (fn.includes('guru') || fn.includes('pegangan guru')) return 'Guru & Staf';
    return 'Semua Tingkat / Umum';
  };

  const cleanTitle = (fileName: string): string => {
    return fileName
      .replace(/\.(pdf|epub|mobi|txt)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Process batch files
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);

    const newStaged: StagedEBook[] = [];
    let currentCounter = existingTotalEBooks + stagedList.length + 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = cleanTitle(file.name);
      const category = detectCategory(file.name);
      const gradeLevel = detectGradeLevel(file.name);
      const code = `EB-2024-${String(currentCounter++).padStart(3, '0')}`;
      const tempId = `eb-bulk-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

      let thumbnail = generateCoverCanvasThumbnail(title);
      let pages = 80 + Math.floor(Math.random() * 120);
      let hasExtracted = false;

      // Extract first page preview if PDF
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const { dataUrl, totalPages } = await extractPdfFirstPage(file, title);
          if (dataUrl) {
            thumbnail = dataUrl;
            hasExtracted = true;
          }
          if (totalPages && totalPages > 0) {
            pages = totalPages;
          }
        } catch (_) {
          // Fallback thumbnail is already set
        }
      }

      newStaged.push({
        id: tempId,
        tempFile: file,
        code,
        title,
        author: 'Tim Penulis MA Roudlotul Jadid',
        publisher: 'Kemenag RI / Kemendikbudristek',
        publishYear: 2024,
        category,
        gradeLevel,
        totalPages: pages,
        fileSizeStr: formatFileSize(file.size),
        fileSizeBytes: file.size,
        fileName: file.name,
        coverThumbnail: thumbnail,
        hasExtractedCover: hasExtracted,
      });
    }

    setStagedList((prev) => [...prev, ...newStaged]);
    setIsProcessingFiles(false);
  };

  const handleRemoveStaged = (id: string) => {
    setStagedList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<StagedEBook>) => {
    setStagedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleApplyBulkCategory = () => {
    setStagedList((prev) => prev.map((item) => ({ ...item, category: bulkCategory })));
  };

  const handleApplyBulkGrade = () => {
    setStagedList((prev) => prev.map((item) => ({ ...item, gradeLevel: bulkGrade })));
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Judul,Penulis,Penerbit,Tahun,Kategori,Jenjang,Halaman,NamaFile\n' +
      'Matematika Tingkat Lanjut X,Drs. Budi Santoso,Kemendikbudristek,2024,Sains Murni & Matematika,Kelas X,180,Matematika_X.pdf\n' +
      'Fikih Ibadah Santri,KH. Ahmad Dahlan,Pustaka Probolinggo,2024,Pendidikan Agama Islam & Fikih,Semua Tingkat / Umum,140,Fikih_Ibadah.pdf\n' +
      'Bahasa Arab MA XI,Ust. Hasan Basri,Kemenag RI,2024,Bahasa Arab & Sastra,Kelas XI,165,Bahasa_Arab_XI.pdf\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_upload_ebook_masal.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;

    let currentCounter = existingTotalEBooks + stagedList.length + 1;
    const parsed: StagedEBook[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 1 && cols[0]) {
        const title = cols[0];
        const author = cols[1] || 'Tim Penulis Madrasah';
        const publisher = cols[2] || 'Pustaka MA Roudlotul Jadid';
        const year = parseInt(cols[3], 10) || 2024;
        const category = (cols[4] as EBookCategory) || detectCategory(title);
        const gradeLevel = (cols[5] as EBookGradeLevel) || detectGradeLevel(title);
        const pages = parseInt(cols[6], 10) || 120;
        const fileName = cols[7] || `${title.replace(/\s+/g, '_')}.pdf`;
        const code = `EB-2024-${String(currentCounter++).padStart(3, '0')}`;
        const tempId = `eb-bulk-csv-${Date.now()}-${i}`;

        parsed.push({
          id: tempId,
          code,
          title,
          author,
          publisher,
          publishYear: year,
          category,
          gradeLevel,
          totalPages: pages,
          fileSizeStr: '2.5 MB',
          fileSizeBytes: 2621440,
          fileName,
          coverThumbnail: generateCoverCanvasThumbnail(title),
          hasExtractedCover: true,
        });
      }
    }

    setStagedList((prev) => [...prev, ...parsed]);
    setCsvPasteModalOpen(false);
    setCsvText('');
  };

  // Commit all staged e-books to system
  const handleSaveAll = async () => {
    if (stagedList.length === 0) return;
    setIsSaving(true);

    const now = new Date().toISOString().split('T')[0];
    const newEBooks: EBook[] = [];

    for (let i = 0; i < stagedList.length; i++) {
      const item = stagedList[i];
      const realId = `eb-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;

      // Save binary to IndexedDB if file object exists
      let hasUploadedPdf = false;
      if (item.tempFile) {
        try {
          await savePdfToStorage(realId, item.tempFile);
          hasUploadedPdf = true;
        } catch (e) {
          console.warn('PDF IndexedDB save fallback:', e);
        }
      }

      newEBooks.push({
        id: realId,
        code: item.code,
        title: item.title,
        author: item.author,
        publisher: item.publisher,
        publishYear: item.publishYear,
        category: item.category,
        gradeLevel: item.gradeLevel,
        totalPages: item.totalPages,
        fileType: 'pdf_upload',
        pdfFileName: item.fileName,
        pdfFileSize: item.fileSizeBytes,
        hasUploadedPdf,
        synopsis: `E-Book ${item.title} resmi untuk santri dan pengajar MA Roudlotul Jadid Ganding Probolinggo.`,
        coverGradient: 'from-emerald-700 to-teal-900',
        coverImageUrl: item.coverThumbnail,
        addedDate: now,
        readsCount: 0,
        fileSize: item.fileSizeStr,
      });
    }

    onSaveBulk(newEBooks);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Files className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Upload E-Book Masal (Batch Import)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  LocalStorage Siap
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Pilih puluhan file PDF sekaligus atau impor daftar metadata CSV tanpa batas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Actions: Drag & Drop Zone + CSV tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-2 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.epub,.mobi,.txt"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Klik atau Tarik (Drag & Drop) File E-Book ke Sini
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mendukung multi-file format PDF (.pdf), EPUB. Judul & cover otomatis diekstrak.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Pilih Sekaligus (5, 10, 20+ Dokumen)
              </span>
            </div>

            {/* CSV Template & Import tools */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Opsi Format CSV
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Punya rekap metadata judul e-book dalam format Excel/Spreadsheet?
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh Template CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCsvPasteModalOpen(true)}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-600 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Tempel / Impor Data CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Bulk Batch Customizer (When items exist) */}
          {stagedList.length > 0 && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  Antrean Siap Simpan: {stagedList.length} E-Book
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Bulk Category apply */}
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as EBookCategory)}
                  className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyBulkCategory}
                  className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  Set Kategori Semua
                </button>

                {/* Bulk Grade apply */}
                <select
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value as EBookGradeLevel)}
                  className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyBulkGrade}
                  className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  Set Jenjang Semua
                </button>
              </div>
            </div>
          )}

          {/* Staged Items Table / List */}
          {stagedList.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <Files className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600">Belum ada file yang dipilih untuk diunggah</p>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan kotak di atas untuk memilih file PDF atau impor melalui template CSV.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span>Daftar E-Book Siap Diunggah ({stagedList.length})</span>
                <button
                  type="button"
                  onClick={() => setStagedList([])}
                  className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold normal-case"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Antrean</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {stagedList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-slate-50 transition-colors flex items-center gap-3.5"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center">
                      {idx + 1}
                    </span>

                    {/* Thumbnail preview */}
                    <div className="w-10 h-14 bg-slate-200 rounded shadow-sm overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                      <img
                        src={item.coverThumbnail}
                        alt="Sampul"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item info & inline editable fields */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {item.code}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                          className="text-xs font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none w-full"
                          placeholder="Judul E-Book..."
                        />
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              category: e.target.value as EBookCategory,
                            })
                          }
                          className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.gradeLevel}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              gradeLevel: e.target.value as EBookGradeLevel,
                            })
                          }
                          className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none"
                        >
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>

                        <span className="text-[10px] text-slate-400">
                          {item.totalPages} hlm • {item.fileSizeStr}
                        </span>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveStaged(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Hapus dari antrean"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Semua e-book yang disimpan akan tersimpan aman di <b>LocalStorage Browser</b> tanpa terhapus saat refresh.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={stagedList.length === 0 || isSaving}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Menyimpan E-Book...'
                  : `Simpan Semua (${stagedList.length}) ke Katalog`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Nested CSV Paste Sub-Modal */}
      {csvPasteModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Tempel Data CSV Metadata E-Book
              </h3>
              <button
                type="button"
                onClick={() => setCsvPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Format kolom CSV: <br />
              <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-teal-800">
                Judul,Penulis,Penerbit,Tahun,Kategori,Jenjang,Halaman,NamaFile
              </code>
            </p>

            <textarea
              rows={7}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Judul,Penulis,Penerbit,Tahun,Kategori,Jenjang,Halaman,NamaFile&#10;Fisika Terapan X,Drs. Hadi,Kemendikbud,2024,Sains Murni & Matematika,Kelas X,180,Fisika_X.pdf"
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCsvPasteModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={!csvText.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-lg disabled:opacity-50"
              >
                Impor Baris ke Antrean
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
