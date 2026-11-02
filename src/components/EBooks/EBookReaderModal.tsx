import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Maximize2, 
  Minimize2, 
  Bookmark, 
  ExternalLink,
  List,
  Download,
  FileText,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { EBook } from '../../types/library';
import { getPdfBlobFromStorage, generateEBookPdfBlob, formatFileSize } from '../../utils/pdfStorage';

interface EBookReaderModalProps {
  ebook: EBook;
  onClose: () => void;
}

type ThemeMode = 'light' | 'sepia' | 'dark';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';
type ViewMode = 'pdf' | 'text';

export const EBookReaderModal: React.FC<EBookReaderModalProps> = ({ ebook, onClose }) => {
  // Determine default mode: if it has uploaded PDF or PDF url, default to 'pdf'
  const hasPdfAvailable = !!(ebook.hasUploadedPdf || ebook.pdfFileName || ebook.fileUrl || ebook.fileType === 'pdf_upload' || ebook.fileType === 'pdf_url');

  const [viewMode, setViewMode] = useState<ViewMode>(hasPdfAvailable ? 'pdf' : 'text');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>('sepia');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // PDF blob state
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>(
    ebook.pdfFileName || `${ebook.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`
  );

  // Load PDF Blob on mount or generate sample on the fly
  useEffect(() => {
    let activeUrl: string | null = null;
    let isCancelled = false;

    const loadPdf = async () => {
      setIsPdfLoading(true);
      setPdfError(null);

      try {
        // 1. Check if uploaded PDF is in IndexedDB
        const storedBlob = await getPdfBlobFromStorage(ebook.id);

        if (storedBlob && !isCancelled) {
          activeUrl = URL.createObjectURL(storedBlob);
          setPdfBlobUrl(activeUrl);
          setIsPdfLoading(false);
          return;
        }

        // 2. If an external URL is set (e.g. google drive or public web PDF)
        if (ebook.fileUrl && !isCancelled) {
          setPdfBlobUrl(ebook.fileUrl);
          setIsPdfLoading(false);
          return;
        }

        // 3. Fallback: generate a clean valid PDF document from chapters/synopsis on the fly
        if (!isCancelled) {
          const generatedBlob = generateEBookPdfBlob(ebook);
          activeUrl = URL.createObjectURL(generatedBlob);
          setPdfBlobUrl(activeUrl);
          setIsPdfLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading PDF blob:', err);
        if (!isCancelled) {
          setPdfError('Gagal memuat dokumen PDF. Anda dapat menggunakan mode baca teks di bawah.');
          setIsPdfLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [ebook]);

  const chapters = ebook.chapters && ebook.chapters.length > 0 
    ? ebook.chapters 
    : [
        {
          id: 'c-default',
          title: 'Ikhtisar & Dokumen Buku',
          content: ebook.synopsis || 'Tidak ada konten teks pratinjau yang tersedia.'
        }
      ];

  const currentChapter = chapters[currentChapterIndex] || chapters[0];
  const progressPercent = Math.round(((currentChapterIndex + 1) / chapters.length) * 100);

  // Download PDF file directly
  const handleDownloadPdf = async () => {
    try {
      let downloadBlob: Blob | null = await getPdfBlobFromStorage(ebook.id);
      if (!downloadBlob) {
        downloadBlob = generateEBookPdfBlob(ebook);
      }

      const tempUrl = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = tempUrl;
      a.download = pdfFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(tempUrl), 2000);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      if (pdfBlobUrl) {
        window.open(pdfBlobUrl, '_blank');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else if (ebook.fileUrl) {
      window.open(ebook.fileUrl, '_blank');
    }
  };

  // Theme styling helpers for text reading mode
  const themeClasses = {
    light: 'bg-white text-slate-800',
    sepia: 'bg-[#faf6ee] text-[#4a3b2c]',
    dark: 'bg-slate-900 text-slate-200',
  };

  const headerFooterTheme = {
    light: 'bg-slate-50 border-slate-200 text-slate-700',
    sepia: 'bg-[#f4ede0] border-[#e6dbc8] text-[#5c4a38]',
    dark: 'bg-slate-950 border-slate-800 text-slate-300',
  };

  const sidebarTheme = {
    light: 'bg-white border-slate-200',
    sepia: 'bg-[#f7f0e3] border-[#e6dbc8]',
    dark: 'bg-slate-900 border-slate-800',
  };

  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed lg:leading-loose',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-3 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full h-full lg:max-w-6xl lg:h-[95vh] lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-colors duration-200 ${
          viewMode === 'pdf' ? 'bg-slate-900 text-white border-slate-800' : `${themeClasses[theme]} ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`
        }`}
      >
        {/* Top Header Bar */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
          viewMode === 'pdf' ? 'bg-slate-950 border-slate-800 text-white' : headerFooterTheme[theme]
        }`}>
          {/* Book Info */}
          <div className="flex items-center gap-3 overflow-hidden">
            {viewMode === 'text' && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                title="Daftar Isi / Bab"
              >
                <List className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
                PDF
              </span>
              <div className="overflow-hidden">
                <h2 className="text-xs sm:text-sm font-bold truncate tracking-tight">{ebook.title}</h2>
                <p className="text-[10px] sm:text-[11px] opacity-75 truncate">{ebook.author} • {ebook.category}</p>
              </div>
            </div>
          </div>

          {/* Mode Switcher & Reader Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle: [Dokumen PDF] vs [Mode Teks] */}
            <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setViewMode('pdf')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'pdf'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan Dokumen PDF Asli"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dokumen PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'text'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan Ringkasan Teks & Bab"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mode Teks</span>
                <span className="sm:hidden">Teks</span>
              </button>
            </div>

            {/* Actions in PDF View */}
            {viewMode === 'pdf' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownloadPdf}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-semibold border border-emerald-500/30 transition-colors"
                  title="Unduh Dokumen PDF ke Perangkat"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  onClick={handleOpenInNewTab}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Buka Dokumen PDF di Tab Baru Browser"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Text Mode Customizations */}
            {viewMode === 'text' && (
              <>
                {/* Font size adjustments */}
                <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setFontSize('sm')}
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${fontSize === 'sm' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white' : 'opacity-70'}`}
                    title="Ukuran teks kecil"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize('base')}
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${fontSize === 'base' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white' : 'opacity-70'}`}
                    title="Ukuran teks normal"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('lg')}
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${fontSize === 'lg' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white' : 'opacity-70'}`}
                    title="Ukuran teks besar"
                  >
                    A+
                  </button>
                </div>

                {/* Theme switcher */}
                <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-1 rounded text-xs transition-colors ${theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                    title="Mode Terang (Putih)"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${theme === 'sepia' ? 'bg-[#faf6ee] text-[#5c4a38] shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                    title="Mode Sepia Klasik"
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-1 rounded text-xs transition-colors ${theme === 'dark' ? 'bg-slate-800 text-yellow-300 shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                    title="Mode Gelap / Malam"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden md:block"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all ml-1"
              title="Tutup Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= MAIN CONTENT VIEWPORT ================= */}
        {viewMode === 'pdf' ? (
          /* PDF VIEWER MODE */
          <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
            {/* Top Info Banner for PDF */}
            <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-white truncate">{pdfFileName}</span>
                <span className="text-slate-400">({ebook.fileSize || 'PDF'})</span>
                {ebook.hasUploadedPdf && (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                    File Asli Terunggah
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleDownloadPdf}
                  className="sm:hidden text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh</span>
                </button>
                <button
                  onClick={handleOpenInNewTab}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Buka Penuh di Tab Baru</span>
                </button>
              </div>
            </div>

            {/* Main PDF Frame / Loading State */}
            <div className="flex-1 relative overflow-hidden bg-slate-900">
              {isPdfLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="font-semibold text-sm">Menyiapkan Dokumen PDF E-Book...</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Memuat data file dari penyimpanan perpustakaan digital MA Roudlotul Jadid.
                  </p>
                </div>
              ) : pdfError ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-rose-300">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <p className="font-semibold text-sm">{pdfError}</p>
                  <button
                    onClick={() => setViewMode('text')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Beralih ke Mode Baca Teks
                  </button>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full border-0 bg-slate-900"
                  title={`Dokumen PDF - ${ebook.title}`}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileText className="w-10 h-10 text-slate-600" />
                  <p className="text-sm text-slate-400">File PDF belum tersedia.</p>
                </div>
              )}
            </div>

            {/* Mobile Fallback Helper Notice (discreet) */}
            <div className="sm:hidden px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Perangkat seluler? Gunakan tombol tab baru atau unduh jika tampilan browser terbatas.</span>
              <button onClick={handleOpenInNewTab} className="text-emerald-400 font-semibold underline shrink-0 ml-2">
                Buka
              </button>
            </div>
          </div>
        ) : (
          /* TEXT / CHAPTER READING MODE */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
              <div 
                className="bg-emerald-600 h-1 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Main Reading Canvas & Sidebar */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Table of contents sidebar drawer */}
              {isSidebarOpen && (
                <aside 
                  className={`w-72 shrink-0 border-r flex flex-col overflow-hidden z-20 shadow-lg ${sidebarTheme[theme]}`}
                >
                  <div className="p-3.5 border-b border-inherit flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                      Daftar Bab & Isi
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">{chapters.length} Bab</span>
                  </div>

                  <div className="p-2 overflow-y-auto flex-1 space-y-1">
                    {chapters.map((ch, idx) => (
                      <button
                        key={ch.id || idx}
                        onClick={() => {
                          setCurrentChapterIndex(idx);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-start gap-2.5 ${
                          currentChapterIndex === idx
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-85'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="line-clamp-2">{ch.title}</span>
                      </button>
                    ))}
                  </div>
                </aside>
              )}

              {/* Reading text viewport */}
              <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 max-w-3xl mx-auto w-full">
                {/* Switch to PDF banner */}
                <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">
                      Tersedia dalam format dokumen PDF lengkap ({pdfFileName})
                    </span>
                  </div>
                  <button
                    onClick={() => setViewMode('pdf')}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Buka PDF
                  </button>
                </div>

                {/* Chapter Header */}
                <div className="mb-6 pb-4 border-b border-inherit/40 text-center">
                  <span className="text-[11px] font-semibold tracking-widest uppercase opacity-75">
                    Bab {currentChapterIndex + 1} dari {chapters.length}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
                    {currentChapter.title}
                  </h1>
                </div>

                {/* Reading Content paragraphs */}
                <article className={`space-y-4 font-serif ${fontSizeClasses[fontSize]}`}>
                  {currentChapter.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('1. ') || paragraph.trim().startsWith('2. ')) {
                      return (
                        <div key={pIdx} className="pl-4 border-l-2 border-emerald-500/50 py-1 space-y-1.5">
                          {paragraph.split('\n').map((line, lIdx) => (
                            <p key={lIdx} className="leading-relaxed">{line}</p>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} className="leading-relaxed text-justify indent-6">
                        {paragraph}
                      </p>
                    );
                  })}
                </article>
              </main>
            </div>

            {/* Footer Navigation Bar for Chapters */}
            <div className={`px-4 py-2.5 border-t flex items-center justify-between shrink-0 ${headerFooterTheme[theme]}`}>
              <button
                onClick={() => setCurrentChapterIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentChapterIndex === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentChapterIndex === 0
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Bab Sebelumnya</span>
                <span className="sm:hidden">Sebelumnya</span>
              </button>

              <div className="text-center text-[11px] opacity-75 font-mono">
                Halaman Bab {currentChapterIndex + 1} / {chapters.length} ({progressPercent}%)
              </div>

              <button
                onClick={() => setCurrentChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1))}
                disabled={currentChapterIndex === chapters.length - 1}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentChapterIndex === chapters.length - 1
                    ? 'opacity-40 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-xs'
                }`}
              >
                <span className="hidden sm:inline">Bab Selanjutnya</span>
                <span className="sm:hidden">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
