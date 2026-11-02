import React, { useState, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { EBook } from '../../types/library';
import { savePdfToStorage, formatFileSize } from '../../utils/pdfStorage';
import { extractPdfFirstPage, generateCoverCanvasThumbnail } from '../../utils/pdfThumbnail';

interface EBookFormModalProps {
  initialEBook?: EBook | null;
  totalEBooks: number;
  onSave: (ebook: EBook) => void;
  onClose: () => void;
}

export const EBookFormModal: React.FC<EBookFormModalProps> = ({
  initialEBook,
  totalEBooks,
  onSave,
  onClose,
}) => {
  const isEditing = !!initialEBook;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCode = `EB-2024-${String(totalEBooks + 1).padStart(3, '0')}`;

  // State: Only Judul and PDF File are needed!
  const [title, setTitle] = useState(initialEBook?.title || '');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadedPdfName, setUploadedPdfName] = useState<string>(initialEBook?.pdfFileName || '');
  const [uploadedPdfBytes, setUploadedPdfBytes] = useState<number | undefined>(initialEBook?.pdfFileSize);
  const [hasExistingPdf, setHasExistingPdf] = useState<boolean>(!!initialEBook?.hasUploadedPdf);
  
  // First page thumbnail preview
  const [firstPageThumbnail, setFirstPageThumbnail] = useState<string>(
    initialEBook?.coverImageUrl || initialEBook?.coverUrl || ''
  );
  const [detectedPages, setDetectedPages] = useState<number>(initialEBook?.totalPages || 1);
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert filename to a clean title
  const cleanTitleFromFileName = (fileName: string): string => {
    return fileName
      .replace(/\.pdf$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const processSelectedPdf = async (file: File) => {
    setError(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('File harus berformat PDF (.pdf). Silakan pilih dokumen PDF yang valid.');
      return;
    }

    setPdfFile(file);
    setUploadedPdfName(file.name);
    setUploadedPdfBytes(file.size);

    // Auto-fill title if empty or if not explicitly modified
    const cleanTitle = cleanTitleFromFileName(file.name);
    if (!title.trim() || !isEditing) {
      setTitle(cleanTitle);
    }

    // Extract first page of the PDF immediately
    setIsExtractingThumbnail(true);
    try {
      const { dataUrl, totalPages } = await extractPdfFirstPage(file, cleanTitle);
      setFirstPageThumbnail(dataUrl);
      setDetectedPages(totalPages || 1);
    } catch (err) {
      console.warn('Gagal mengekstrak halaman pertama PDF:', err);
      setFirstPageThumbnail(generateCoverCanvasThumbnail(cleanTitle));
    } finally {
      setIsExtractingThumbnail(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedPdf(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedPdf(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setUploadedPdfName('');
    setUploadedPdfBytes(undefined);
    setHasExistingPdf(false);
    setFirstPageThumbnail('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Mohon masukkan atau sesuaikan judul e-book.');
      return;
    }

    if (!pdfFile && !hasExistingPdf) {
      setError('Mohon pilih file e-book PDF yang ingin diunggah.');
      return;
    }

    setIsSaving(true);
    const ebookId = initialEBook?.id || `eb-${Date.now()}`;

    try {
      let isPdfSaved = hasExistingPdf;
      let finalFileName = uploadedPdfName || initialEBook?.pdfFileName || `${title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
      let finalFileSize = uploadedPdfBytes || initialEBook?.pdfFileSize;

      // Save PDF binary to IndexedDB
      if (pdfFile) {
        await savePdfToStorage(ebookId, pdfFile, pdfFile.name);
        isPdfSaved = true;
        finalFileName = pdfFile.name;
        finalFileSize = pdfFile.size;
      }

      // Ensure first page thumbnail exists
      const coverImage = firstPageThumbnail || generateCoverCanvasThumbnail(title.trim());

      // Prepare complete EBook object, setting default values silently for omitted metadata
      const ebookData: EBook = {
        id: ebookId,
        code: initialEBook?.code || defaultCode,
        isbn: initialEBook?.isbn,
        title: title.trim(),
        author: initialEBook?.author || 'Pustaka MA Roudlotul Jadid',
        publisher: initialEBook?.publisher || 'MA Roudlotul Jadid',
        publishYear: initialEBook?.publishYear || new Date().getFullYear(),
        category: initialEBook?.category || 'Buku Teks Kurikulum Merdeka',
        gradeLevel: initialEBook?.gradeLevel || 'Semua Tingkat / Umum',
        totalPages: detectedPages || initialEBook?.totalPages || 1,
        fileType: 'pdf_upload',
        fileSize: finalFileSize ? formatFileSize(finalFileSize) : 'PDF Dokumen',
        coverGradient: initialEBook?.coverGradient || 'from-emerald-700 via-teal-700 to-green-900',
        coverUrl: coverImage,
        coverImageUrl: coverImage,
        synopsis: title.trim(),
        pdfFileName: finalFileName,
        pdfFileSize: finalFileSize,
        hasUploadedPdf: isPdfSaved,
        readsCount: initialEBook?.readsCount || 0,
        addedDate: initialEBook?.addedDate || new Date().toISOString().split('T')[0],
      };

      onSave(ebookData);
      onClose();
    } catch (err: any) {
      console.error('Error saving PDF:', err);
      setError(err?.message || 'Terjadi kendala saat menyimpan file PDF. Silakan coba kembali.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {isEditing ? 'Edit E-Book PDF' : 'Upload E-Book PDF'}
              </h3>
              <p className="text-xs text-slate-500">
                Cukup upload file PDF dan judul. Halaman pertama otomatis jadi sampul.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info pill */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Praktis & Otomatis:</strong> Admin tidak perlu menginput keterangan lain. Cukup upload file PDF, sistem langsung membaca judul dan mengambil halaman pertama sebagai sampul e-book.
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Step 1: Upload PDF File */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center justify-between">
              <span>File Dokumen PDF <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-500">Format .pdf</span>
            </label>

            {!pdfFile && !hasExistingPdf ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-100/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  Pilih atau Seret File PDF ke Sini
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Dukung buku teks, modul kurikulum merdeka, kitab, panduan, atau materi ajar PDF.
                </p>
                <button
                  type="button"
                  className="mt-3.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File PDF dari Komputer</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-emerald-200 p-4 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 truncate text-xs">
                        {pdfFile ? pdfFile.name : uploadedPdfName || 'Dokumen.pdf'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px] shrink-0">
                        {pdfFile ? 'PDF Baru' : 'PDF Tersimpan'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ukuran: {pdfFile ? formatFileSize(pdfFile.size) : formatFileSize(uploadedPdfBytes || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                    <span>Ganti PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus file PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Judul E-Book (Auto-filled & Editable) */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center justify-between">
              <span>Judul E-Book <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-500">Otomatis terisi dari nama file</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Contoh: Fikih Ibadah Praktis Madrasah Aliyah Kelas XI"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-800"
            />
          </div>

          {/* Step 3: Pratinjau Halaman Pertama PDF */}
          {(firstPageThumbnail || isExtractingThumbnail) && (
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center justify-between">
                <span>Halaman Pertama PDF (Sampul Katalog)</span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ditampilkan di Katalog E-Book
                </span>
              </label>

              <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                {/* Book Thumbnail container */}
                <div className="w-28 sm:w-32 aspect-[1/1.41] bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden relative shrink-0">
                  {isExtractingThumbnail ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 text-emerald-700 p-2 text-center">
                      <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-[10px] font-semibold">Membaca Halaman 1...</span>
                    </div>
                  ) : (
                    <img
                      src={firstPageThumbnail}
                      alt="Pratinjau Halaman Pertama PDF"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info next to preview */}
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    <FileText className="w-3 h-3" /> Halaman Pertama Terdeteksi
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                    {title || 'Judul E-Book'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Gambar di samping akan menjadi sampul utama e-book di halaman katalog pembaca MA Roudlotul Jadid.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 ${
                isSaving ? 'opacity-70 cursor-wait' : 'active:scale-95'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan File PDF...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Simpan & Terbitkan E-Book'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
