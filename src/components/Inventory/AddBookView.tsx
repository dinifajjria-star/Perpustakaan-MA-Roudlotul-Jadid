import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Printer,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Tag,
  DollarSign,
  Bookmark,
  Layers,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Save
} from 'lucide-react';
import { Book, BookCategory, BookCondition, BookSource, LibrarySettings } from '../../types/library';
import { formatRupiah, getCategoryBadgeClass } from '../../utils/formatters';
import { BarcodeView } from '../Common/BarcodeView';
import { BulkImportModal } from '../Common/BulkImportModal';
import { downloadBookCsvTemplate } from '../../utils/csvTemplates';
import { HighlightMatch } from '../Common/HighlightMatch';
import { suggestBookCatalogTitles } from '../../utils/recommendations';

interface AddBookViewProps {
  booksCount: number;
  settings: LibrarySettings;
  onAddBook: (book: Book, printImmediately?: boolean) => void;
  onAddBooksBulk?: (books: Book[]) => void;
  onCancel: () => void;
  onPrintLabel: (book: Book) => void;
  onPrintBlankForm?: () => void;
}

interface BookPreset {
  id: string;
  categoryTab: 'madrasah' | 'umum' | 'sastra' | 'referensi';
  badge: string;
  title: string;
  author: string;
  publisher: string;
  category: BookCategory;
  rack: string;
  price: number;
  synopsis: string;
  source: BookSource;
  coverGradient: string;
  callNumber: string;
}

export const AddBookView: React.FC<AddBookViewProps> = ({
  booksCount,
  settings,
  onAddBook,
  onAddBooksBulk,
  onCancel,
  onPrintLabel,
  onPrintBlankForm,
}) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [activePresetTab, setActivePresetTab] = useState<'madrasah' | 'umum' | 'sastra' | 'referensi'>('madrasah');
  const [appliedPresetTitle, setAppliedPresetTitle] = useState<string | null>(null);

  const categories: BookCategory[] = [
    'Buku Teks Kurikulum Merdeka',
    '000 - Karya Umum & Komputer',
    '100 - Filsafat & Psikologi',
    '200 - Agama',
    '300 - Ilmu Sosial',
    '400 - Bahasa',
    '500 - Sains Murni & Matematika',
    '600 - Teknologi & Terapan',
    '700 - Kesenian & Olahraga',
    '800 - Kesusastraan & Fiksi',
    '900 - Sejarah & Geografi',
    'Referensi & Kamus',
  ];

  const coverGradients = [
    { label: 'Biru Edukasi', value: 'from-blue-600 to-indigo-800' },
    { label: 'Zamrud Sains', value: 'from-emerald-600 to-teal-800' },
    { label: 'Amber Sastra', value: 'from-amber-600 to-orange-800' },
    { label: 'Ungu Filosofi', value: 'from-purple-600 to-indigo-900' },
    { label: 'Merah Referensi', value: 'from-rose-600 to-red-900' },
    { label: 'Batu Sejarah', value: 'from-stone-700 to-neutral-900' },
  ];

  // Auto-generate standard library Call Number (e.g. "510 SUS m")
  const generateCallNumber = (title: string, author: string, category: string) => {
    let ddcCode = '800';
    if (category.includes('Kurikulum Merdeka')) ddcCode = '371.3';
    else if (category.startsWith('000')) ddcCode = '005';
    else if (category.startsWith('100')) ddcCode = '150';
    else if (category.startsWith('200')) ddcCode = '297';
    else if (category.startsWith('300')) ddcCode = '330';
    else if (category.startsWith('400')) ddcCode = '410';
    else if (category.startsWith('500')) ddcCode = '500';
    else if (category.startsWith('600')) ddcCode = '600';
    else if (category.startsWith('700')) ddcCode = '700';
    else if (category.startsWith('800')) ddcCode = '813';
    else if (category.startsWith('900')) ddcCode = '959';
    else if (category.includes('Referensi')) ddcCode = 'R 030';

    const authorWords = author.trim().split(' ').filter(Boolean);
    const authorToken =
      authorWords.length > 0
        ? authorWords[authorWords.length - 1].slice(0, 3).toUpperCase()
        : 'XXX';

    const titleWords = title.trim().split(' ').filter(Boolean);
    let titleLetter = 'a';
    if (titleWords.length > 0) {
      titleLetter = titleWords[0].charAt(0).toLowerCase();
    }

    return `${ddcCode} ${authorToken} ${titleLetter}`;
  };

  const nextNumber = booksCount + 1;
  const currentYear = new Date().getFullYear();
  const defaultCode = `BK-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
  const defaultBarcode = `899${currentYear}${String(nextNumber).padStart(4, '0')}`;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    publishYear: currentYear,
    isbn: '',
    category: '200 - Agama' as BookCategory,
    rack: 'Rak A-01 (Agama)',
    totalCopies: 5,
    condition: 'Baik' as BookCondition,
    source: 'BOS' as BookSource,
    price: 65000,
    synopsis: '',
    callNumber: '297 XXX a',
    coverGradient: 'from-emerald-600 to-teal-800',
  });

  const [printAfterSave, setPrintAfterSave] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);

  const liveTitleSuggestions = useMemo(() => {
    if (!formData.title || formData.title.trim().length < 2) return [];
    return suggestBookCatalogTitles(formData.title, 5);
  }, [formData.title]);

  // PRESET CATALOG FOR QUICK 1-CLICK AUTOFILL
  const bookPresets: BookPreset[] = [
    // Madrasah Kemenag
    {
      id: 'p-qh',
      categoryTab: 'madrasah',
      badge: 'Buku Utama MA',
      title: 'Al-Qur\'an Hadis untuk MA Kelas XI (Kurikulum Merdeka)',
      author: 'H. Ahmad Syamsuri, M.Ag.',
      publisher: 'Direktorat KSKK Madrasah Kemenag RI',
      category: '200 - Agama',
      rack: 'Rak A-01 (Al-Qur\'an & Hadis)',
      price: 65000,
      synopsis: 'Buku teks utama pembelajaran Al-Quran dan Hadis madrasah aliyah fase F materi kajian tafsir tematik dan sanad hadis.',
      source: 'BOS',
      coverGradient: 'from-emerald-600 to-teal-800',
      callNumber: '297.1 SYA a',
    },
    {
      id: 'p-fikih',
      categoryTab: 'madrasah',
      badge: 'Fikih MA',
      title: 'Fikih Ibadah & Muamalah MA Kelas X',
      author: 'Drs. M. Ridwan, M.Pd.I',
      publisher: 'Toha Putra Semarang',
      category: '200 - Agama',
      rack: 'Rak A-02 (Fikih & Ushul Fikih)',
      price: 58000,
      synopsis: 'Pedoman fikih ibadah praktis, thaharah, shalat, zakat, puasa, dan transaksi muamalah kontemporer madrasah aliyah.',
      source: 'BOS',
      coverGradient: 'from-teal-600 to-emerald-900',
      callNumber: '297.4 RID f',
    },
    {
      id: 'p-aa',
      categoryTab: 'madrasah',
      badge: 'Akidah Akhlak',
      title: 'Akidah Akhlak untuk MA Kelas XI',
      author: 'Dr. H. Masrukin, M.Ag.',
      publisher: 'Kemenag RI & Toha Putra',
      category: '200 - Agama',
      rack: 'Rak A-01 (Akidah Akhlak)',
      price: 60000,
      synopsis: 'Kajian ketauhidan asma wa sifat, aliran-aliran teologi Islam, dan pembinaan akhlak mulia kepribadian santri.',
      source: 'BOS',
      coverGradient: 'from-cyan-600 to-blue-900',
      callNumber: '297.3 MAS a',
    },
    {
      id: 'p-ski',
      categoryTab: 'madrasah',
      badge: 'Sejarah Islam',
      title: 'Sejarah Kebudayaan Islam (SKI) MA Kelas XII',
      author: 'Dr. Rusydi Umar, M.Hum.',
      publisher: 'Direktorat KSKK Madrasah Kemenag RI',
      category: '200 - Agama',
      rack: 'Rak A-03 (Sejarah Kebudayaan Islam)',
      price: 62000,
      synopsis: 'Kajian peradaban Islam era Abbasiyah, Dinasti Turki Utsmani, Mughal, Safawi, hingga perkembangan dakwah Islam di Nusantara.',
      source: 'BOS',
      coverGradient: 'from-amber-600 to-yellow-800',
      callNumber: '297.9 UMA s',
    },
    {
      id: 'p-arab',
      categoryTab: 'madrasah',
      badge: 'Bahasa Arab',
      title: 'Al-Lughah Al-Arabiyyah: Bahasa Arab MA Kelas X',
      author: 'Tim MGMP Bahasa Arab Madrasah',
      publisher: 'Direktorat KSKK Madrasah Kemenag RI',
      category: '400 - Bahasa',
      rack: 'Rak B-01 (Bahasa Arab)',
      price: 65000,
      synopsis: 'Modul penguasaan maharah istima, kalam, qiraah, dan kitabah tata bahasa nahwu sharaf untuk madrasah aliyah fase E.',
      source: 'BOS',
      coverGradient: 'from-emerald-700 to-green-950',
      callNumber: '492.7 MGM l',
    },

    // Pelajaran Umum Kemendikbud
    {
      id: 'p-mtk',
      categoryTab: 'umum',
      badge: 'Sains & MTK',
      title: 'Matematika Tingkat Lanjut SMA/MA Kelas XI',
      author: 'Dicki Susanto, Savitri K.',
      publisher: 'Pusat Perbukuan Kemendikbudristek',
      category: '500 - Sains Murni & Matematika',
      rack: 'Rak B-02 (Matematika & Sains)',
      price: 72000,
      synopsis: 'Materi fungsi polinomial, matriks, transformasi geometri aljabar, dan konsep dasar kalkulus diferensial.',
      source: 'BOS',
      coverGradient: 'from-blue-600 to-indigo-800',
      callNumber: '510 SUS m',
    },
    {
      id: 'p-bio',
      categoryTab: 'umum',
      badge: 'Biologi',
      title: 'Biologi Campbell Edisi Kedelapan Jilid 1',
      author: 'Neil A. Campbell, Jane B. Reece',
      publisher: 'Erlangga',
      category: '500 - Sains Murni & Matematika',
      rack: 'Rak B-03 (Biologi)',
      price: 185000,
      synopsis: 'Referensi biologi internasional mencakup biologi sel, genetika molekuler, mekanisme evolusi, dan anatomi tumbuhan.',
      source: 'Pembelian Sekolah',
      coverGradient: 'from-emerald-600 to-teal-800',
      callNumber: '570 CAM b',
    },
    {
      id: 'p-fisika',
      categoryTab: 'umum',
      badge: 'Fisika',
      title: 'Fisika Dasar: Prinsip dan Penerapan Edisi 7',
      author: 'David Halliday, Robert Resnick',
      publisher: 'Erlangga',
      category: '500 - Sains Murni & Matematika',
      rack: 'Rak B-02 (Fisika)',
      price: 185000,
      synopsis: 'Referensi komprehensif mekanika, termodinamika, gelombang bunyi, elektrostatika, dan optika modern.',
      source: 'Pembelian Sekolah',
      coverGradient: 'from-cyan-600 to-blue-900',
      callNumber: '530 HAL f',
    },
    {
      id: 'p-indo',
      categoryTab: 'umum',
      badge: 'Bahasa Indonesia',
      title: 'Bahasa Indonesia: Cerdas Cergas Berbahasa & Bersastra SMA/MA',
      author: 'Fadilah Tri Aulia, Sefi Indra Gumilar',
      publisher: 'Pusat Perbukuan Kemendikbudristek',
      category: 'Buku Teks Kurikulum Merdeka',
      rack: 'Rak B-01 (Bahasa Indonesia)',
      price: 68000,
      synopsis: 'Panduan menulis teks argumentasi, eksplanasi, resensi buku sastra, serta apresiasi puisi dan cerpen.',
      source: 'Kemendikbud',
      coverGradient: 'from-rose-600 to-red-900',
      callNumber: '371.3 AUL b',
    },

    // Kesusastraan & Novel Santri
    {
      id: 'p-n5m',
      categoryTab: 'sastra',
      badge: 'Novel Santri',
      title: 'Negeri 5 Menara (Trilogi Pertama)',
      author: 'Ahmad Fuadi',
      publisher: 'Gramedia Pustaka Utama',
      category: '800 - Kesusastraan & Fiksi',
      rack: 'Rak C-01 (Kesusastraan & Fiksi)',
      price: 85000,
      synopsis: 'Kisah 6 santri dari berbagai pelosok nusantara yang dipertemukan di Pondok Madani dan menggapai impian dunia dengan mantra Man Jadda Wajada.',
      source: 'Hibah/Donasi',
      coverGradient: 'from-amber-600 to-orange-800',
      callNumber: '813 FUA n',
    },
    {
      id: 'p-aac',
      categoryTab: 'sastra',
      badge: 'Sastra Religi',
      title: 'Ayat-Ayat Cinta: Novel Pembangun Jiwa',
      author: 'Habiburrahman El Shirazy',
      publisher: 'Republika Penerbit',
      category: '800 - Kesusastraan & Fiksi',
      rack: 'Rak C-01 (Kesusastraan & Fiksi)',
      price: 88000,
      synopsis: 'Novel romansa religi perjuangan mahasiswa Indonesia yang menuntut ilmu di Universitas Al-Azhar Kairo Mesir.',
      source: 'Pembelian Sekolah',
      coverGradient: 'from-rose-700 to-pink-900',
      callNumber: '813 ELS a',
    },
    {
      id: 'p-delisa',
      categoryTab: 'sastra',
      badge: 'Novel Inspiratif',
      title: 'Hafalan Shalat Delisa',
      author: 'Tere Liye',
      publisher: 'Republika Penerbit',
      category: '800 - Kesusastraan & Fiksi',
      rack: 'Rak C-01 (Kesusastraan & Fiksi)',
      price: 75000,
      synopsis: 'Kisah ketabahan seorang gadis cilik Aceh dalam menghadapi bencana tsunami sambil terus berusaha menuntaskan hafalan shalatnya.',
      source: 'Hibah/Donasi',
      coverGradient: 'from-teal-600 to-emerald-900',
      callNumber: '813 TER h',
    },

    // Referensi & Kamus
    {
      id: 'p-munawwir',
      categoryTab: 'referensi',
      badge: 'Kamus Besar',
      title: 'Kamus Al-Munawwir Arab - Indonesia Terlengkap Edisi Kedua',
      author: 'KH. Ahmad Warson Munawwir',
      publisher: 'Pustaka Progressif Yogyakarta',
      category: 'Referensi & Kamus',
      rack: 'Rak R-01 (Referensi Khusus)',
      price: 245000,
      synopsis: 'Kamus rujukan standar pesantren dan madrasah memuat lebih dari 100.000 entri leksikon bahasa Arab klasik dan kontemporer.',
      source: 'Pembelian Sekolah',
      coverGradient: 'from-stone-700 to-neutral-900',
      callNumber: 'R 492.7 MUN k',
    },
    {
      id: 'p-kbbi',
      categoryTab: 'referensi',
      badge: 'Kamus Nasional',
      title: 'Kamus Besar Bahasa Indonesia (KBBI) Edisi V',
      author: 'Badan Pengembangan Bahasa Kemendikbud',
      publisher: 'Balai Pustaka',
      category: 'Referensi & Kamus',
      rack: 'Rak R-01 (Referensi Khusus)',
      price: 320000,
      synopsis: 'Kamus standar bahasa Indonesia resmi acuan tata bahasa baku dan istilah keilmuan nasional.',
      source: 'BOS',
      coverGradient: 'from-blue-700 to-indigo-950',
      callNumber: 'R 413 BAD k',
    },
  ];

  const handleApplyPreset = (preset: BookPreset) => {
    setFormData({
      title: preset.title,
      author: preset.author,
      publisher: preset.publisher,
      publishYear: currentYear,
      isbn: '978-623-' + Math.floor(100000 + Math.random() * 900000) + '-0',
      category: preset.category,
      rack: preset.rack,
      totalCopies: 5,
      condition: 'Baik',
      source: preset.source,
      price: preset.price,
      synopsis: preset.synopsis,
      callNumber: preset.callNumber,
      coverGradient: preset.coverGradient,
    });
    setAppliedPresetTitle(preset.title);
    setTimeout(() => setAppliedPresetTitle(null), 3000);
  };

  const handleResetForm = () => {
    setFormData({
      title: '',
      author: '',
      publisher: '',
      publishYear: currentYear,
      isbn: '',
      category: '200 - Agama',
      rack: 'Rak A-01 (Agama)',
      totalCopies: 5,
      condition: 'Baik',
      source: 'BOS',
      price: 65000,
      synopsis: '',
      callNumber: '297 XXX a',
      coverGradient: 'from-emerald-600 to-teal-800',
    });
  };

  // Sync title or author to call number
  const handleTitleOrAuthorChange = (newTitle: string, newAuthor: string, newCat: string) => {
    const autoCall = generateCallNumber(newTitle, newAuthor, newCat);
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      author: newAuthor,
      category: newCat as BookCategory,
      callNumber: autoCall,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newBook: Book = {
      id: `book-${Date.now()}`,
      code: defaultCode,
      barcode: defaultBarcode,
      ...formData,
      availableCopies: formData.totalCopies,
      addedDate: new Date().toISOString().split('T')[0],
    };

    onAddBook(newBook, printAfterSave);

    if (printAfterSave) {
      onPrintLabel(newBook);
    } else {
      setSuccessSaved(true);
      setTimeout(() => {
        setSuccessSaved(false);
        handleResetForm();
      }, 1500);
    }
  };

  const filteredPresets = bookPresets.filter((p) => p.categoryTab === activePresetTab);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Kembali ke Katalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Tambah Koleksi Buku Baru
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {settings.schoolName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registrasi katalog buku digital dengan template preset otomatis, impor Excel/CSV massal, dan nomor panggil DDC standar.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadBookCsvTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200"
            title="Unduh file format CSV untuk diisi di Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Unduh Template CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
            title="Buka panel impor data buku massal dari Excel atau CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Impor Massal (Excel / CSV)</span>
          </button>

          {onPrintBlankForm && (
            <button
              type="button"
              onClick={onPrintBlankForm}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-all flex items-center gap-1.5"
              title="Cetak lembar formulir fisik kosong untuk pencatatan buku manual"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Blanko Fisik</span>
            </button>
          )}
        </div>
      </div>

      {/* INTERACTIVE PRESET TEMPLATES BAR */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Pilih Template Buku Siap Pakai (Isi Otomatis 1-Klik)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih salah satu template di bawah untuk mengisi formulir buku secara instan sesuai kurikulum MA Roudlotul Jadid.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Kosongkan Form</span>
            </button>
          </div>
        </div>

        {/* Preset Category Switcher */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-100">
          <button
            type="button"
            onClick={() => setActivePresetTab('madrasah')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'madrasah'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            📚 Buku Madrasah (Kemenag)
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('umum')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'umum'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            🔬 Pelajaran Umum & Sains
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('sastra')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'sastra'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            📖 Sastra & Novel Santri
          </button>
          <button
            type="button"
            onClick={() => setActivePresetTab('referensi')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activePresetTab === 'referensi'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            📕 Referensi, Kitab & Kamus
          </button>
        </div>

        {/* Preset Cards Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {filteredPresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3 rounded-xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {preset.callNumber}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 line-clamp-1">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {preset.author} • {preset.publisher}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{preset.rack}</span>
                <span className="font-semibold text-emerald-700 group-hover:underline">
                  Pakai Template →
                </span>
              </div>
            </button>
          ))}
        </div>

        {appliedPresetTitle && (
          <div className="text-xs text-emerald-800 font-semibold bg-emerald-100/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Template "{appliedPresetTitle}" berhasil diaplikasikan ke formulir di bawah!</span>
          </div>
        )}
      </div>

      {successSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-sm">
              Buku baru berhasil tersimpan ke inventaris perpustakaan! Form siap untuk buku berikutnya.
            </span>
          </div>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
          >
            Lihat di Katalog
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Realtime Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Fields (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Row 1: Judul Buku with Recommendations */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-800">
                  Judul Lengkap Buku <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Kode Otomatis: <b className="font-mono text-slate-700">{defaultCode}</b>
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: Al-Qur'an Hadis untuk MA Kelas XI (Kurikulum Merdeka)"
                value={formData.title}
                onChange={(e) => {
                  handleTitleOrAuthorChange(e.target.value, formData.author, formData.category);
                  setShowTitleSuggestions(true);
                }}
                onFocus={() => setShowTitleSuggestions(true)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 text-sm font-medium"
              />

              {/* Title Recommendations Dropdown */}
              {showTitleSuggestions && liveTitleSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-30 space-y-0.5 max-h-72 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Rekomendasi Judul & Buku Berdasarkan Ketikan:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTitleSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {liveTitleSuggestions.map((sug, idx) => (
                    <button
                      key={sug.isbn || idx}
                      type="button"
                      onClick={() => {
                        handleTitleOrAuthorChange(sug.title, sug.author, sug.category);
                        setFormData((prev) => ({
                          ...prev,
                          title: sug.title,
                          author: sug.author,
                          publisher: sug.publisher,
                          category: sug.category,
                          isbn: sug.isbn,
                          callNumber: sug.callNumber,
                        }));
                        setShowTitleSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg text-slate-800 flex items-center justify-between transition-colors group"
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 truncate">
                          <HighlightMatch text={sug.title} query={formData.title} />
                        </div>
                        <div className="text-[11px] text-slate-500">
                          <HighlightMatch text={sug.author} query={formData.title} /> • {sug.publisher}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        {sug.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 2: Pengarang & Penerbit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pengarang / Penulis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: H. Ahmad Syamsuri / Tim Penulis"
                  value={formData.author}
                  onChange={(e) =>
                    handleTitleOrAuthorChange(formData.title, e.target.value, formData.category)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Penerbit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Direktorat KSKK Madrasah Kemenag"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Row 3: Tahun Terbit, ISBN & Nomor Panggil Otomatis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit</label>
                <input
                  type="number"
                  min="1950"
                  max="2030"
                  value={formData.publishYear}
                  onChange={(e) =>
                    setFormData({ ...formData, publishYear: parseInt(e.target.value) || currentYear })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor ISBN</label>
                <input
                  type="text"
                  placeholder="978-623-xxx-x"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    No. Panggil (Call No)
                  </label>
                  <span className="text-[10px] text-emerald-600 font-semibold">DDC Otomatis</span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.callNumber}
                  onChange={(e) => setFormData({ ...formData, callNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            {/* Row 4: Kategori Klasifikasi DDC & Lokasi Rak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Klasifikasi / Kategori DDC <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleTitleOrAuthorChange(formData.title, formData.author, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 focus:border-emerald-500 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi Rak Buku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rak A-01 (Agama & Qur'an)"
                  value={formData.rack}
                  onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Row 5: Stok Fisik, Kondisi, Sumber & Harga Buku */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah Stok (Eks) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={formData.totalCopies}
                  onChange={(e) =>
                    setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kondisi Buku</label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value as BookCondition })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  <option value="Baik">Baik (Baru)</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Koleksi</label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value as BookSource })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  <option value="BOS">Dana BOS</option>
                  <option value="Pembelian Sekolah">Pembelian Madrasah</option>
                  <option value="Kemendikbud">Kemenag / Kemendikbud</option>
                  <option value="Hibah/Donasi">Wakaf / Donasi Santri</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Satuan (Rp)</label>
                <input
                  type="number"
                  step="5000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            {/* Row 6: Warna Sampul & Sinopsis */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Gaya Desain Sampul Katalog
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {coverGradients.map((g) => (
                    <button
                      type="button"
                      key={g.value}
                      onClick={() => setFormData({ ...formData, coverGradient: g.value })}
                      className={`h-9 rounded-xl bg-gradient-to-br ${g.value} flex items-center justify-center text-white text-[10px] font-bold shadow-xs transition-transform ${
                        formData.coverGradient === g.value
                          ? 'ring-2 ring-offset-2 ring-emerald-600 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {formData.coverGradient === g.value ? '✓' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sinopsis / Ringkasan Isi Buku
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik ulasan singkat buku untuk membantu santri dan guru saat mencari referensi..."
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 leading-relaxed"
                />
              </div>
            </div>

            {/* Print Label Option & Submit Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printAfterSave}
                  onChange={(e) => setPrintAfterSave(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 text-xs">
                  Langsung buka pratinjau cetak stiker label & barcode setelah disimpan
                </span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/2 sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                  title="Simpan buku baru ke LocalStorage browser"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Buku ke LocalStorage</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Preview Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-20 space-y-4">
            {/* Realtime Spine Label & Barcode Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                  Label Punggung Buku
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Pratinjau Stiker
                </span>
              </div>

              {/* Spine Label Box */}
              <div className="w-44 mx-auto border-2 border-dashed border-slate-400 p-3 rounded-xl bg-slate-50 text-slate-900 text-center space-y-2">
                <div className="text-[10px] font-black uppercase leading-tight tracking-tight text-slate-800">
                  {settings.schoolName}
                </div>
                <div className="my-1.5 py-1 px-2 font-mono font-black text-sm bg-white border border-slate-300 rounded shadow-xs">
                  <div>{formData.callNumber.split(' ')[0] || '297'}</div>
                  <div>{formData.callNumber.split(' ')[1] || 'XXX'}</div>
                  <div>{formData.callNumber.split(' ')[2] || 'a'}</div>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <BarcodeView value={defaultBarcode} height={22} showText={false} />
                  <div className="font-mono text-[10px] font-bold mt-0.5 text-slate-700">
                    {defaultCode}
                  </div>
                </div>
              </div>

              {/* Book Info Summary */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Judul:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
                    {formData.title || '(Ketik judul buku)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pengarang:</span>
                  <span className="text-slate-800 truncate max-w-[170px]">
                    {formData.author || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stok:</span>
                  <span className="font-bold text-emerald-700">{formData.totalCopies} Eksemplar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nilai:</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(formData.price)}</span>
                </div>
              </div>
            </div>

            {/* Quick Helper Info */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 space-y-1.5">
              <span className="font-bold block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Tips Pengkatalogan Buku
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Gunakan menu <b>Impor Massal (Excel / CSV)</b> jika Anda memiliki puluhan atau ratusan buku baru dari BOS untuk langsung masuk ke sistem secara instan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        type="books"
        booksCount={booksCount}
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportBooks={(newBooks) => {
          if (onAddBooksBulk) {
            onAddBooksBulk(newBooks);
          } else {
            newBooks.forEach((b) => onAddBook(b, false));
          }
        }}
      />
    </div>
  );
};
