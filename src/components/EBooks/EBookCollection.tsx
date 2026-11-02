import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  FileText, 
  Sparkles,
  RefreshCw,
  Files
} from 'lucide-react';
import { EBook } from '../../types/library';
import { EBookReaderModal } from './EBookReaderModal';
import { EBookFormModal } from './EBookFormModal';
import { BulkEBookUploadModal } from './BulkEBookUploadModal';
import { deletePdfFromStorage, deleteMultiplePdfsFromStorage } from '../../utils/pdfStorage';

interface EBookCollectionProps {
  ebooks: EBook[];
  isAdmin?: boolean;
  onAddEBook?: (ebook: EBook) => void;
  onAddEBooksBulk?: (newEBooks: EBook[]) => void;
  onUpdateEBook?: (ebook: EBook) => void;
  onDeleteEBook?: (ebookId: string) => void;
  onDeleteEBooksBulk?: (ebookIds: string[]) => void;
  onIncrementReadCount?: (ebookId: string) => void;
}

export const EBookCollection: React.FC<EBookCollectionProps> = ({
  ebooks,
  isAdmin = false,
  onAddEBook,
  onAddEBooksBulk,
  onUpdateEBook,
  onDeleteEBook,
  onDeleteEBooksBulk,
  onIncrementReadCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'newest' | 'reads'>('newest');

  // Modals state
  const [readingEBook, setReadingEBook] = useState<EBook | null>(null);
  const [editingEBook, setEditingEBook] = useState<EBook | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Bulk selection state (for Admin)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Filtered & Sorted E-Books (Searches by Title)
  const filteredEBooks = ebooks
    .filter((eb) => {
      const matchSearch =
        eb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (eb.pdfFileName && eb.pdfFileName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'reads') return b.readsCount - a.readsCount;
      if (sortBy === 'newest') return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      return a.title.localeCompare(b.title);
    });

  // Handle open reader
  const handleOpenReader = (ebook: EBook) => {
    setReadingEBook(ebook);
    if (onIncrementReadCount) {
      onIncrementReadCount(ebook.id);
    }
  };

  // Bulk selection helpers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredEBooks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEBooks.map((e) => e.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = async () => {
    if (onDeleteEBooksBulk && selectedIds.length > 0) {
      await deleteMultiplePdfsFromStorage(selectedIds);
      onDeleteEBooksBulk(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleDeleteSingle = async (ebook: EBook) => {
    if (confirm(`Hapus e-book "${ebook.title}" beserta file PDF-nya dari katalog?`)) {
      await deletePdfFromStorage(ebook.id);
      if (onDeleteEBook) {
        onDeleteEBook(ebook.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perpustakaan Digital MA Roudlotul Jadid</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Katalog E-Book PDF
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Koleksi e-book format PDF resmi. Setiap e-book menampilkan halaman pertama sebagai sampul dan judul untuk kemudahan membaca santri serta dewan guru.
            </p>
          </div>

          {/* Quick Metrics & Upload Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-white/10 backdrop-blur px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-lg sm:text-xl font-bold text-white">{ebooks.length}</span>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">Total E-Book</span>
            </div>

            {isAdmin && onAddEBook && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-teal-500/30 hover:bg-teal-500/40 text-teal-200 border border-teal-400/30 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  <Files className="w-4 h-4 text-teal-300" />
                  <span>+ Upload E-Book Masal</span>
                </button>
                <button
                  onClick={() => {
                    setEditingEBook(null);
                    setIsFormOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Upload E-Book PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search by Title */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul e-book..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-emerald-500 font-medium"
          >
            <option value="newest">✨ E-Book Terbaru</option>
            <option value="title">🔤 Judul (A - Z)</option>
            <option value="reads">🔥 Paling Sering Dibaca</option>
          </select>
        </div>
      </div>

      {/* Admin Bulk Actions Toolbar */}
      {isAdmin && (
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              {selectedIds.length === filteredEBooks.length && filteredEBooks.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Pilih Semua ({filteredEBooks.length})</span>
            </button>
            {selectedIds.length > 0 && (
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {selectedIds.length} e-book terpilih
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.length} E-Book Terpilih</span>
            </button>
          )}
        </div>
      )}

      {/* E-Books Grid Cards - Showing Only First Page of PDF and Title */}
      {filteredEBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada e-book yang ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? `Tidak ada judul e-book yang cocok dengan "${searchQuery}".` : 'Belum ada koleksi e-book di perpustakaan.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              Tampilkan Semua Judul
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filteredEBooks.map((ebook) => {
            const isSelected = selectedIds.includes(ebook.id);
            const coverImage = ebook.coverImageUrl || ebook.coverUrl;

            return (
              <div
                key={ebook.id}
                className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group relative ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90 shadow-sm'
                }`}
              >
                {/* 1. Halaman Pertama dari E-Book PDF (Aspect Ratio A4 Buku 1:1.41) */}
                <div 
                  onClick={() => handleOpenReader(ebook)}
                  className="relative aspect-[1/1.41] w-full bg-slate-100 overflow-hidden cursor-pointer border-b border-slate-100"
                >
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={`Halaman pertama ${ebook.title}`}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    /* Fallback clean page 1 look */
                    <div className="w-full h-full bg-white p-3 flex flex-col justify-between text-center border-2 border-slate-200">
                      <div className="text-[9px] font-bold text-emerald-800 tracking-wider">
                        MA ROUDLOTUL JADID
                      </div>
                      <div className="font-bold text-[11px] text-slate-800 line-clamp-3">
                        {ebook.title}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        HALAMAN 1 • PDF
                      </div>
                    </div>
                  )}

                  {/* PDF Badge Indicator on Top-Left */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs backdrop-blur-sm">
                    <FileText className="w-2.5 h-2.5" /> PDF
                  </div>

                  {/* Admin Selection Checkbox on Top-Right */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(ebook.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
                      title="Pilih untuk hapus massal"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/90" />
                      )}
                    </button>
                  )}

                  {/* Overlay read prompt on hover */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                    <span className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Baca PDF</span>
                    </span>
                  </div>
                </div>

                {/* 2. Judul E-Book (Clean, prominent, no clutter) */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => handleOpenReader(ebook)}
                      className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
                      title={ebook.title}
                    >
                      {ebook.title}
                    </h3>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenReader(ebook)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Buka PDF</span>
                    </button>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setEditingEBook(ebook);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                          title="Edit Judul atau Ganti File PDF"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {onDeleteEBook && (
                          <button
                            onClick={() => handleDeleteSingle(ebook)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                            title="Hapus E-Book"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      {readingEBook && (
        <EBookReaderModal
          ebook={readingEBook}
          onClose={() => setReadingEBook(null)}
        />
      )}

      {/* Add / Edit Form Modal (Simplified) */}
      {isFormOpen && (
        <EBookFormModal
          initialEBook={editingEBook}
          totalEBooks={ebooks.length}
          onSave={(savedBook) => {
            if (editingEBook && onUpdateEBook) {
              onUpdateEBook(savedBook);
            } else if (onAddEBook) {
              onAddEBook(savedBook);
            }
            setIsFormOpen(false);
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEBook(null);
          }}
        />
      )}

      {/* Bulk E-Book Upload Modal */}
      {isBulkModalOpen && (
        <BulkEBookUploadModal
          existingTotalEBooks={ebooks.length}
          onSaveBulk={(newEBooks) => {
            if (onAddEBooksBulk) {
              onAddEBooksBulk(newEBooks);
            }
            setIsBulkModalOpen(false);
          }}
          onClose={() => setIsBulkModalOpen(false)}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-800">
              Konfirmasi Hapus Massal E-Book
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Anda akan menghapus <span className="font-bold text-rose-600">{selectedIds.length} e-book</span> beserta seluruh file PDF terkait. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Batalkan
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                Ya, Hapus {selectedIds.length} E-Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
