import React from 'react';
import {
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  Printer,
  Edit3,
  Clock,
  User,
  ShieldCheck,
  CheckCircle,
  X
} from 'lucide-react';
import { Book, LoanTransaction } from '../../types/library';
import { formatRupiah, formatDateIndo, getCategoryBadgeClass } from '../../utils/formatters';
import { BarcodeView } from '../Common/BarcodeView';

interface BookDetailModalProps {
  book: Book;
  loans: LoanTransaction[];
  onClose: () => void;
  onQuickBorrow: (book: Book) => void;
  onPrintLabel: (book: Book) => void;
  onEditBook?: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  loans,
  onClose,
  onQuickBorrow,
  onPrintLabel,
  onEditBook,
}) => {
  // Related loans for this specific book
  const bookLoans = loans.filter((l) => l.bookId === book.id);
  const activeBookLoans = bookLoans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const pastBookLoans = bookLoans.filter((l) => l.status === 'Kembali' || l.status === 'Hilang');

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with visual color banner */}
        <div className={`p-6 bg-gradient-to-r ${book.coverGradient} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-lg bg-black/20 hover:bg-black/30 text-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold text-white mb-2">
            {book.category}
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold leading-snug">{book.title}</h2>
          <p className="text-xs text-white/90 mt-1">
            Penulis: <span className="font-semibold">{book.author}</span> • Penerbit:{' '}
            <span>{book.publisher} ({book.publishYear})</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Quick Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Nomor Panggil (DDC)
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">{book.callNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Lokasi Rak
              </span>
              <span className="font-semibold text-slate-800 text-sm">{book.rack}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Ketersediaan
              </span>
              <span className={`font-bold text-sm ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {book.availableCopies} / {book.totalCopies} Eks
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Kondisi Fisik
              </span>
              <span className="font-semibold text-slate-800 text-sm">{book.condition}</span>
            </div>
          </div>

          {/* Barcode & Metadata Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                Detail Identitas Buku
              </span>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Kode Buku:</span>
                  <span className="font-mono font-bold text-slate-800">{book.code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Nomor ISBN:</span>
                  <span className="font-mono text-slate-800">{book.isbn || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Sumber Pengadaan:</span>
                  <span className="text-slate-800 font-medium">{book.source}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Nilai Ganti Rugi:</span>
                  <span className="text-slate-800 font-medium">{formatRupiah(book.price)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase mb-2">
                Barcode Koleksi Perpustakaan
              </span>
              <BarcodeView value={book.barcode} height={36} showText={true} />
              <button
                onClick={() => onPrintLabel(book)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Label Buku Ini</span>
              </button>
            </div>
          </div>

          {/* Synopsis */}
          {book.synopsis && (
            <div>
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-1.5">
                Sinopsis / Ringkasan Isi
              </span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed italic">
                "{book.synopsis}"
              </div>
            </div>
          )}

          {/* Active Borrowers */}
          <div>
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-2">
              Status Peminjam Saat Ini ({activeBookLoans.length} eksemplar di luar)
            </span>
            {activeBookLoans.length > 0 ? (
              <div className="space-y-2">
                {activeBookLoans.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950"
                  >
                    <div>
                      <span className="font-bold">{l.memberName}</span>{' '}
                      <span className="text-[11px] text-slate-500">
                        ({l.memberRole} • {l.memberClass})
                      </span>
                      <div className="text-[10px] text-slate-500">
                        Dipinjam: {formatDateIndo(l.borrowDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-rose-700">
                        Jatuh Tempo: {formatDateIndo(l.dueDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center font-medium">
                Semua eksemplar tersedia di rak {book.rack} dan siap dipinjam.
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>LocalStorage Aktif</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium"
              >
                Tutup
              </button>
              {onEditBook && (
                <button
                  onClick={() => {
                    onClose();
                    onEditBook(book);
                  }}
                  className="px-4 py-2 font-semibold rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all flex items-center gap-1.5 shadow-xs"
                  title="Edit data buku ini lalu simpan ke LocalStorage"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Data Buku</span>
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onQuickBorrow(book);
                }}
                disabled={!isAvailable}
                className={`px-5 py-2 font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                  isAvailable
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Pinjamkan Buku Ini</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
