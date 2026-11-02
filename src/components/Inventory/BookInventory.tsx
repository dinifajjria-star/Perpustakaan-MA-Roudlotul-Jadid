import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Trash2,
  Edit3,
  Eye,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  Tag,
  MapPin,
  Bookmark,
  Save,
  X
} from 'lucide-react';
import { Book, BookCategory, BookCondition, BookSource, LibrarySettings } from '../../types/library';
import { formatRupiah, formatDateIndo, getCategoryBadgeClass } from '../../utils/formatters';
import { BarcodeView } from '../Common/BarcodeView';
import { TimePeriod, isDateInPeriod, getPeriodLabel } from '../../utils/datePeriods';
import { PeriodFilterBar } from '../Common/PeriodFilterBar';
import { downloadBookCsvTemplate } from '../../utils/csvTemplates';
import { HighlightMatch } from '../Common/HighlightMatch';

interface BookInventoryProps {
  books: Book[];
  settings: LibrarySettings;
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onDeleteBooksBulk?: (bookIds: string[]) => void;
  onOpenPrintLabels: (selectedBooks: Book[]) => void;
  onSelectBookDetail: (book: Book) => void;
  onQuickBorrowBook: (book: Book) => void;
  initialEditingBook?: Book | null;
  onClearInitialEditingBook?: () => void;
}

export const BookInventory: React.FC<BookInventoryProps> = ({
  books,
  settings,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onDeleteBooksBulk,
  onOpenPrintLabels,
  onSelectBookDetail,
  onQuickBorrowBook,
  initialEditingBook,
  onClearInitialEditingBook,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'BORROWED'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bookToDeleteSingle, setBookToDeleteSingle] = useState<Book | null>(null);

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    publishYear: new Date().getFullYear(),
    isbn: '',
    category: '500 - Sains Murni & Matematika' as BookCategory,
    rack: 'Rak B-01',
    totalCopies: 5,
    condition: 'Baik' as BookCondition,
    source: 'BOS' as BookSource,
    price: 75000,
    synopsis: '',
    callNumber: '',
  });

  // Categories list
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

    // 3 letters from author surname/name
    const authorWords = author.trim().split(' ').filter(Boolean);
    const authorToken = authorWords.length > 0 ? authorWords[authorWords.length - 1].slice(0, 3).toUpperCase() : 'XXX';
    
    // First letter of first non-article title word in lowercase
    const titleWords = title.trim().split(' ').filter(Boolean);
    let titleLetter = 'a';
    if (titleWords.length > 0) {
      titleLetter = titleWords[0].charAt(0).toLowerCase();
    }

    return `${ddcCode} ${authorToken} ${titleLetter}`;
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.callNumber.toLowerCase().includes(q) ||
        b.rack.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'ALL' || b.category === selectedCategory;
      const matchCondition = selectedCondition === 'ALL' || b.condition === selectedCondition;
      
      let matchAvailability = true;
      if (availabilityFilter === 'AVAILABLE') matchAvailability = b.availableCopies > 0;
      if (availabilityFilter === 'BORROWED') matchAvailability = b.availableCopies < b.totalCopies;

      const matchPeriod = selectedPeriod === 'all' || isDateInPeriod(b.addedDate, selectedPeriod);

      return matchQuery && matchCategory && matchCondition && matchAvailability && matchPeriod;
    });
  }, [books, searchQuery, selectedCategory, selectedCondition, availabilityFilter, selectedPeriod]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publisher: '',
      publishYear: new Date().getFullYear(),
      isbn: '',
      category: 'Buku Teks Kurikulum Merdeka',
      rack: 'Rak A-01',
      totalCopies: 5,
      condition: 'Baik',
      source: 'BOS',
      price: 75000,
      synopsis: '',
      callNumber: '',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publishYear: book.publishYear,
      isbn: book.isbn,
      category: book.category,
      rack: book.rack,
      totalCopies: book.totalCopies,
      condition: book.condition,
      source: book.source,
      price: book.price,
      synopsis: book.synopsis,
      callNumber: book.callNumber,
    });
    setIsFormModalOpen(true);
  };

  useEffect(() => {
    if (initialEditingBook) {
      handleOpenEdit(initialEditingBook);
      if (onClearInitialEditingBook) {
        onClearInitialEditingBook();
      }
    }
  }, [initialEditingBook]);

  // Smart autofill Call Number when typing
  const handleTitleOrAuthorChange = (newTitle: string, newAuthor: string, newCategory: string) => {
    const autoCall = generateCallNumber(newTitle, newAuthor, newCategory);
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      author: newAuthor,
      category: newCategory as BookCategory,
      callNumber: prev.callNumber && prev.callNumber !== '' ? prev.callNumber : autoCall,
    }));
  };

  // Save Book
  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const callNumber = formData.callNumber || generateCallNumber(formData.title, formData.author, formData.category);

    if (editingBook) {
      // update
      const diff = formData.totalCopies - editingBook.totalCopies;
      const updated: Book = {
        ...editingBook,
        ...formData,
        callNumber,
        availableCopies: Math.max(0, editingBook.availableCopies + diff),
      };
      onUpdateBook(updated);
    } else {
      // create new
      const nextNum = books.length + 1;
      const year = new Date().getFullYear();
      const code = `BK-${year}-${String(nextNum).padStart(3, '0')}`;
      const barcode = `899${year}${String(nextNum).padStart(4, '0')}`;
      
      const newBook: Book = {
        id: `book-${Date.now()}`,
        code,
        barcode,
        ...formData,
        callNumber,
        availableCopies: formData.totalCopies,
        coverGradient: 'from-blue-600 to-indigo-900',
        addedDate: new Date().toISOString().split('T')[0],
      };
      onAddBook(newBook);
    }

    setIsFormModalOpen(false);
  };

  // Selection Helpers
  const isAllFilteredSelected = filteredBooks.length > 0 && filteredBooks.every((b) => selectedBookIds.has(b.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const next = new Set(selectedBookIds);
      filteredBooks.forEach((b) => next.delete(b.id));
      setSelectedBookIds(next);
    } else {
      const next = new Set(selectedBookIds);
      filteredBooks.forEach((b) => next.add(b.id));
      setSelectedBookIds(next);
    }
  };

  const selectAllCatalog = () => {
    setSelectedBookIds(new Set(books.map((b) => b.id)));
  };

  const clearAllSelection = () => {
    setSelectedBookIds(new Set());
  };

  const toggleSelectBook = (id: string) => {
    const next = new Set(selectedBookIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBookIds(next);
  };

  // Trigger print selected labels
  const handlePrintSelectedLabels = () => {
    const selected = books.filter((b) => selectedBookIds.has(b.id));
    if (selected.length === 0) {
      onOpenPrintLabels(filteredBooks.slice(0, 8)); // fallback to first 8
    } else {
      onOpenPrintLabels(selected);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Kode Buku', 'No Panggil', 'ISBN', 'Judul', 'Pengarang', 'Penerbit', 'Tahun', 'Kategori', 'Rak', 'Total', 'Tersedia', 'Kondisi', 'Sumber'];
    const rows = books.map((b) => [
      `"${b.code}"`,
      `"${b.callNumber}"`,
      `"${b.isbn}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.author.replace(/"/g, '""')}"`,
      `"${b.publisher.replace(/"/g, '""')}"`,
      b.publishYear,
      `"${b.category}"`,
      `"${b.rack}"`,
      b.totalCopies,
      b.availableCopies,
      `"${b.condition}"`,
      `"${b.source}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `katalog_buku_${settings.schoolName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Inventaris & Katalog Buku
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {books.length} Judul ({books.reduce((a, b) => a + b.totalCopies, 0)} Eksemplar)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold" title="Data buku tersimpan permanen di LocalStorage browser (tidak hilang saat refresh)">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LocalStorage Aktif</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pendataan digital koleksi perpustakaan, klasifikasi DDC, nomor panggil, dan cetak barcode
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Hapus Masal Buku */}
          <button
            type="button"
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
              selectedBookIds.size > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-400'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
            }`}
            title="Hapus buku secara massal / berkelompok"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {selectedBookIds.size > 0
                ? `Hapus Masal (${selectedBookIds.size} Buku)`
                : 'Hapus Masal Buku'}
            </span>
          </button>

          {/* Print Labels Button */}
          <button
            type="button"
            onClick={handlePrintSelectedLabels}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Cetak label nomor panggil dan barcode buku"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Label ({selectedBookIds.size || 'Semua'})</span>
          </button>

          {/* Template CSV */}
          <button
            type="button"
            onClick={downloadBookCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors"
            title="Unduh file template Excel/CSV untuk tambah buku"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Template CSV</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            title="Ekspor katalog buku ke format CSV Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          {/* Add Book Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Buku Baru</span>
          </button>
        </div>
      </div>

      {/* Rekapitulasi Periode Inventaris */}
      <PeriodFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={(p) => setSelectedPeriod(p)}
        title="Rekapitulasi Inventaris Koleksi Buku:"
        summaryText={`${filteredBooks.length} Judul (${filteredBooks.reduce((a, b) => a + b.totalCopies, 0)} Eksemplar)`}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input with Live Recommendations */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik huruf judul buku, pengarang, ISBN, barcode, atau nomor rak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold"
              >
                ×
              </button>
            )}

            {/* Recommendation dropdown */}
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 text-xs animate-fade-in max-h-56 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                  <span>Rekomendasi Buku ({filteredBooks.length})</span>
                  <span className="text-[9px] font-normal text-slate-400">Klik untuk lihat detail</span>
                </div>
                {filteredBooks.length > 0 ? (
                  filteredBooks.slice(0, 5).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBookDetail(b)}
                      className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition-colors border border-transparent hover:border-emerald-200 group"
                    >
                      <div className="overflow-hidden pr-2">
                        <p className="font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                          <HighlightMatch text={b.title} query={searchQuery} />
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          Penulis: <HighlightMatch text={b.author} query={searchQuery} /> • Rak: {b.rack} • Panggil: {b.callNumber}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          b.availableCopies > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.availableCopies > 0 ? `${b.availableCopies} Eks` : 'Habis'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-[11px]">
                    Tidak ada buku yang cocok dengan huruf "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 text-slate-700"
            >
              <option value="ALL">Semua Klasifikasi Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="w-full md:w-44">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 text-slate-700"
            >
              <option value="ALL">Semua Ketersediaan</option>
              <option value="AVAILABLE">Tersedia di Rak</option>
              <option value="BORROWED">Sedang Dipinjam</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              Tabel
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              Kartu
            </button>
          </div>
        </div>

        {/* Quick Chips Filter & Batch Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                onChange={toggleSelectAllFiltered}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold">
                {isAllFilteredSelected ? 'Batal Pilih Semua Filter' : `Pilih Semua (${filteredBooks.length})`}
              </span>
            </label>

            {books.length > filteredBooks.length && (
              <button
                type="button"
                onClick={selectAllCatalog}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline"
              >
                Pilih Seluruh Katalog ({books.length})
              </button>
            )}

            {selectedBookIds.size > 0 && (
              <>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  {selectedBookIds.size} buku terpilih
                </span>

                {/* Tombol Hapus Berkelompok */}
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                  title="Hapus buku yang dipilih secara bersamaan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedBookIds.size})</span>
                </button>

                {/* Tombol Cetak Label Berkelompok */}
                <button
                  type="button"
                  onClick={handlePrintSelectedLabels}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cetak Label ({selectedBookIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={clearAllSelection}
                  className="text-[11px] text-slate-400 hover:text-slate-700 underline transition-colors"
                >
                  Batal Pilih
                </button>
              </>
            )}
          </div>

          <div className="text-slate-500 text-[11px]">
            Menampilkan <b className="text-slate-800">{filteredBooks.length}</b> dari {books.length} judul
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      title="Pilih semua buku"
                    />
                  </th>
                  <th className="py-3 px-3">Kode & Barcode</th>
                  <th className="py-3 px-3">Informasi Buku</th>
                  <th className="py-3 px-3">No. Panggil / DDC</th>
                  <th className="py-3 px-3">Lokasi Rak</th>
                  <th className="py-3 px-3 text-center">Stok (Tersedia/Total)</th>
                  <th className="py-3 px-3">Kondisi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  const isSelected = selectedBookIds.has(book.id);
                  const isAvailable = book.availableCopies > 0;

                  return (
                    <tr
                      key={book.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBook(book.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          title="Pilih buku ini"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-800">{book.code}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {book.barcode}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 max-w-sm">
                        <div
                          onClick={() => onSelectBookDetail(book)}
                          className="font-semibold text-slate-900 hover:text-emerald-600 cursor-pointer transition-colors"
                        >
                          <HighlightMatch text={book.title} query={searchQuery} />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <HighlightMatch text={book.author} query={searchQuery} /> • {book.publisher} ({book.publishYear})
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ISBN: {book.isbn || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
                          {book.callNumber}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border inline-block ${getCategoryBadgeClass(
                              book.category
                            )}`}
                          >
                            {book.category.split('-')[0].trim()}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{book.rack}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          <span className={isAvailable ? 'text-emerald-600' : 'text-rose-600'}>
                            {book.availableCopies}
                          </span>{' '}
                          / {book.totalCopies}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700 font-semibold'
                          }`}
                        >
                          {isAvailable ? 'Tersedia' : 'Habis Dipinjam'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                            book.condition === 'Baik'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {book.condition}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Sumber: {book.source}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pinjam Button */}
                          <button
                            onClick={() => onQuickBorrowBook(book)}
                            disabled={!isAvailable}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Pinjamkan buku ini langsung"
                          >
                            Pinjam
                          </button>

                          {/* Detail button */}
                          <button
                            onClick={() => onSelectBookDetail(book)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Detail Informasi Buku"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(book)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Data Buku"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setBookToDeleteSingle(book)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Buku dari Katalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const isSelected = selectedBookIds.has(book.id);
            const isAvailable = book.availableCopies > 0;

            return (
              <div
                key={book.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isSelected ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBook(book.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        title="Pilih buku ini"
                      />
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {book.callNumber}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {book.availableCopies} / {book.totalCopies} Eks
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectBookDetail(book)}
                    className="font-bold text-sm text-slate-900 hover:text-emerald-600 cursor-pointer transition-colors line-clamp-2 mb-1"
                  >
                    {book.title}
                  </h3>

                  <p className="text-xs text-slate-500 mb-2">
                    {book.author} • {book.publishYear}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg italic">
                    "{book.synopsis || 'Tidak ada deskripsi singkat.'}"
                  </p>

                  <div className="space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Lokasi Rak:
                      </span>
                      <span className="font-medium text-slate-800">{book.rack}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Kode / Barcode:</span>
                      <span className="font-mono text-slate-700">{book.code}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                      book.category
                    )}`}
                  >
                    {book.category.split('-')[0].trim()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuickBorrowBook(book)}
                      disabled={!isAvailable}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                        isAvailable
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      Pinjam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(book)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Data Buku"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookToDeleteSingle(book)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus Buku dari Katalog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Tambah / Edit Buku */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingBook ? 'Edit Data Inventaris Buku' : 'Tambah Buku Baru ke Inventaris'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format metadata resmi perpustakaan sekolah (DDC & Standar Nasional)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBook} className="p-6 space-y-4 text-xs">
              {/* Judul Buku */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Lengkap Buku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Fisika Terapan untuk SMK & SMA Kelas XII"
                  value={formData.title}
                  onChange={(e) =>
                    handleTitleOrAuthorChange(e.target.value, formData.author, formData.category)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              {/* Pengarang & Penerbit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pengarang / Penulis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Prof. Dr. Bambang Sudirman"
                    value={formData.author}
                    onChange={(e) =>
                      handleTitleOrAuthorChange(formData.title, e.target.value, formData.category)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    placeholder="Contoh: Erlangga / Kemendikbud"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Tahun, ISBN, Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    min="1950"
                    max="2030"
                    value={formData.publishYear}
                    onChange={(e) =>
                      setFormData({ ...formData, publishYear: parseInt(e.target.value) || 2024 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    placeholder="978-602-XXX-XXX-X"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Klasifikasi Kategori (DDC)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleTitleOrAuthorChange(formData.title, formData.author, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nomor Panggil & Lokasi Rak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Nomor Panggil (Call Number)
                    </label>
                    <span className="text-[10px] text-emerald-600 font-medium">Otomatis DDC</span>
                  </div>
                  <input
                    type="text"
                    value={formData.callNumber}
                    onChange={(e) => setFormData({ ...formData, callNumber: e.target.value })}
                    placeholder="Contoh: 530 BAM f"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasi Rak / Lemari
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rak B-02 (Sains)"
                    value={formData.rack}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Eksemplar, Kondisi, Sumber Dana, Taksiran Harga */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Eksemplar</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.totalCopies}
                    onChange={(e) =>
                      setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kondisi Fisik</label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value as BookCondition })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sumber Pengadaan</label>
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value as BookSource })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 bg-white"
                  >
                    <option value="BOS">BOS Reguler</option>
                    <option value="Kemendikbud">Kemendikbud</option>
                    <option value="Pembelian Sekolah">Pembelian Sekolah</option>
                    <option value="Hibah/Donasi">Hibah / Donasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga (Ganti Rugi)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Sinopsis */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sinopsis / Ringkasan Buku
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan ringkas topik bahasan buku untuk mempermudah pencarian siswa..."
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 resize-none"
                />
              </div>

              {/* LocalStorage persistence notice */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-emerald-900">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                  <Save className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950">
                      Penyimpanan Permanen LocalStorage Browser
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-200/70 text-[10px] text-emerald-900 font-mono font-semibold">
                      Ctrl+S
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                    Data buku akan langsung disimpan ke memori LocalStorage browser Anda dan <strong>tetap utuh saat halaman di-refresh</strong>.
                  </p>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all text-xs ring-2 ring-emerald-500/30 cursor-pointer"
                  title="Simpan perubahan ke LocalStorage browser"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingBook
                      ? 'Simpan Perubahan Buku (LocalStorage)'
                      : 'Simpan Buku Baru ke LocalStorage'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Batch Action Bar */}
      {selectedBookIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedBookIds.size} Buku Dipilih
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedBookIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSelectedLabels}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-600 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Label</span>
            </button>

            <button
              type="button"
              onClick={clearAllSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Batal pilih"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Buku Berkelompok (Bulk Delete) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedBookIds.size > 0
                      ? `Hapus ${selectedBookIds.size} Buku Sekaligus?`
                      : 'Hapus Buku Secara Masal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedBookIds.size > 0
                      ? 'Tindakan ini akan menghapus data buku terpilih dari katalog perpustakaan.'
                      : 'Pilih buku yang ingin dihapus secara bersamaan.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedBookIds.size === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <div className="text-xs text-slate-600">
                    Belum ada buku yang dicentang. Silakan pilih opsi penghapusan masal:
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={selectAllCatalog}
                      className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Pilih Seluruh Katalog ({books.length} Buku)</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Pilih Hasil Filter Saat Ini ({filteredBooks.length} Buku)
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Alert if any book is currently borrowed */}
                  {(() => {
                    const selectedBooksList = books.filter((b) => selectedBookIds.has(b.id));
                    const borrowedCount = selectedBooksList.filter((b) => b.availableCopies < b.totalCopies).length;
                    if (borrowedCount > 0) {
                      return (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Perhatian Eksemplar Terpinjam:</span>
                            <span>
                              {borrowedCount} dari {selectedBookIds.size} buku yang dipilih saat ini memiliki eksemplar yang sedang dipinjam santri/guru. Menghapus buku akan menghapus pencatatan katalog buku ini.
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Daftar buku yang akan dihapus:
                    </span>
                    <button
                      type="button"
                      onClick={clearAllSelection}
                      className="text-slate-400 hover:text-slate-600 underline text-[11px]"
                    >
                      Kosongkan Pilihan
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
                    {books
                      .filter((b) => selectedBookIds.has(b.id))
                      .map((b) => (
                        <div key={b.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div className="overflow-hidden pr-2">
                            <div className="font-semibold text-slate-900 truncate">{b.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.code} • {b.author}
                            </div>
                          </div>
                          <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 whitespace-nowrap">
                            {b.totalCopies} eks
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batalkan
              </button>
              {selectedBookIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const idsToDelete = Array.from(selectedBookIds);
                    if (idsToDelete.length > 0) {
                      if (onDeleteBooksBulk) {
                        onDeleteBooksBulk(idsToDelete);
                      } else {
                        idsToDelete.forEach((id) => onDeleteBook(id));
                      }
                    }
                    clearAllSelection();
                    setIsBulkDeleteModalOpen(false);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus {selectedBookIds.size} Buku</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Buku Tunggal (Single Delete) */}
      {bookToDeleteSingle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Hapus Buku dari Katalog?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfirmasi penghapusan data buku inventaris perpustakaan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookToDeleteSingle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-sm">{bookToDeleteSingle.title}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  {bookToDeleteSingle.code} • {bookToDeleteSingle.author} ({bookToDeleteSingle.publishYear})
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Rak: <span className="font-medium text-slate-800">{bookToDeleteSingle.rack}</span> • Stok: {bookToDeleteSingle.availableCopies} / {bookToDeleteSingle.totalCopies} eks
                </div>
              </div>

              {bookToDeleteSingle.availableCopies < bookToDeleteSingle.totalCopies && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Buku ini saat ini memiliki eksemplar yang sedang dipinjam santri/guru.
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookToDeleteSingle(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBook(bookToDeleteSingle.id);
                  const next = new Set(selectedBookIds);
                  next.delete(bookToDeleteSingle.id);
                  setSelectedBookIds(next);
                  setBookToDeleteSingle(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Buku Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
