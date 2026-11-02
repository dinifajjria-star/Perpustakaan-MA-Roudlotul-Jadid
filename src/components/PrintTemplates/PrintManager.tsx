import React from 'react';
import { Printer, X, Download, BookOpen, Library, CheckCircle } from 'lucide-react';
import { Book, Member, LoanTransaction, LibrarySettings } from '../../types/library';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { BarcodeView } from '../Common/BarcodeView';
import { TimePeriod, getPeriodLabel } from '../../utils/datePeriods';

export type PrintType =
  | 'labels'
  | 'member-card'
  | 'borrow-slip'
  | 'return-receipt'
  | 'monthly-report'
  | 'blank-member-form'
  | 'blank-book-form';

interface PrintManagerProps {
  type: PrintType;
  settings: LibrarySettings;
  data: {
    books?: Book[];
    member?: Member;
    loan?: LoanTransaction;
    loans?: LoanTransaction[];
    allBooks?: Book[];
    period?: TimePeriod;
  };
  onClose: () => void;
}

export const PrintManager: React.FC<PrintManagerProps> = ({
  type,
  settings,
  data,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-slate-800">
              Pratinjau Cetak{' '}
              {type === 'labels'
                ? 'Stiker Label Barcode Buku'
                : type === 'member-card'
                ? 'Kartu Anggota Perpustakaan'
                : type === 'borrow-slip'
                ? 'Slip Bukti Peminjaman'
                : type === 'return-receipt'
                ? 'Kuitansi Pengembalian & Denda'
                : type === 'blank-member-form'
                ? 'Formulir Pendaftaran Anggota (Blanko Fisik)'
                : type === 'blank-book-form'
                ? 'Lembar Blanko Inventaris Buku Baru'
                : 'Laporan Resmi Perpustakaan'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Ctrl + P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg text-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* TEMPLATE 1: LABELS & BARCODES */}
          {type === 'labels' && data.books && (
            <div className="space-y-6">
              <div className="no-print text-xs text-slate-500 mb-2">
                Format label stiker standar untuk ditempel di punggung dan lembar inventaris buku ({data.books.length} buku).
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4">
                {data.books.map((book) => {
                  const ddcParts = book.callNumber.split(' ');
                  return (
                    <div
                      key={book.id}
                      className="border-2 border-dashed border-slate-400 p-3 rounded-lg flex flex-col justify-between bg-white text-slate-900 print:break-inside-avoid print:border-slate-800"
                    >
                      {/* Label Header */}
                      <div className="text-center pb-1.5 border-b border-slate-300">
                        <div className="text-[10px] font-bold tracking-tight uppercase leading-tight">
                          {settings.libraryName}
                        </div>
                        <div className="text-[9px] text-slate-600 leading-tight">
                          {settings.schoolName}
                        </div>
                      </div>

                      {/* Call number spine block */}
                      <div className="my-2 text-center font-mono font-black text-sm tracking-wider leading-snug py-1 bg-slate-50 border border-slate-200 rounded">
                        <div>{ddcParts[0] || '800'}</div>
                        <div>{ddcParts[1] || 'XXX'}</div>
                        <div>{ddcParts[2] || 'a'}</div>
                      </div>

                      {/* Barcode & Code */}
                      <div className="text-center pt-1 border-t border-slate-200">
                        <BarcodeView value={book.barcode} height={26} showText={false} />
                        <div className="font-mono text-[10px] font-bold mt-0.5">
                          {book.code}
                        </div>
                        <div className="text-[9px] text-slate-600 truncate mt-0.5" title={book.title}>
                          {book.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TEMPLATE 2: MEMBER ID CARD */}
          {type === 'member-card' && data.member && (
            <div className="flex flex-col items-center space-y-6">
              <div className="no-print text-xs text-slate-500 text-center">
                Format kartu anggota resmi ukuran standar (CR80) siap laminating.
              </div>

              {/* CARD PREVIEW */}
              <div className="w-[380px] h-[230px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 flex flex-col justify-between shadow-xl relative overflow-hidden border border-slate-700 print:shadow-none print:border-slate-800 print:break-inside-avoid">
                {/* Decorative background circle */}
                <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-emerald-500/10 pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center gap-3 border-b border-white/15 pb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <Library className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight uppercase leading-tight">
                      KARTU ANGGOTA PERPUSTAKAAN
                    </h4>
                    <p className="text-[10px] text-emerald-300 font-medium">
                      {settings.schoolName}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex items-center gap-4 my-auto">
                  <div className={`w-14 h-16 rounded-xl ${data.member.avatarColor} text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0 border border-white/20`}>
                    {data.member.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="text-sm font-bold truncate text-white">
                      {data.member.name}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-mono">
                      NISN/NIP: {data.member.nisn_nip}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Status: {data.member.role} • {data.member.classOrDept}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Berlaku s/d: Selama menjadi civitas sekolah
                    </div>
                  </div>
                </div>

                {/* Card Footer with Barcode */}
                <div className="flex items-end justify-between pt-2 border-t border-white/15">
                  <div className="bg-white p-1 rounded">
                    <BarcodeView
                      value={data.member.nisn_nip}
                      height={20}
                      showText={false}
                      className="text-slate-900"
                    />
                  </div>
                  <div className="text-right text-[8px] text-slate-400 leading-tight">
                    <div>Kepala Perpustakaan</div>
                    <div className="font-semibold text-slate-200 mt-1">{settings.headLibrarian}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: BORROW SLIP */}
          {type === 'borrow-slip' && data.loan && (
            <div className="max-w-md mx-auto bg-white p-6 border border-slate-300 rounded-xl space-y-4 print:border-none print:p-0 print:max-w-none">
              <div className="text-center border-b border-slate-300 pb-3">
                <h3 className="font-bold text-sm text-slate-900 uppercase">
                  SLIP BUKTI PEMINJAMAN BUKU
                </h3>
                <p className="text-xs font-semibold text-slate-700">{settings.libraryName}</p>
                <p className="text-[10px] text-slate-500">{settings.schoolName} - {settings.address}</p>
              </div>

              <div className="text-xs space-y-1.5 py-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Transaksi:</span>
                  <span className="font-mono font-bold">{data.loan.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Peminjam:</span>
                  <span className="font-semibold">{data.loan.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kelas / Peran:</span>
                  <span>{data.loan.memberRole} ({data.loan.memberClass})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Judul Buku:</span>
                  <span className="font-bold text-right max-w-[220px]">{data.loan.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Panggil / Kode:</span>
                  <span className="font-mono">{data.loan.bookCallNumber} ({data.loan.bookCode})</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Tgl. Pinjam:</span>
                  <span>{formatDateIndo(data.loan.borrowDate)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>BATAS PENGEMBALIAN:</span>
                  <span>{formatDateIndo(data.loan.dueDate)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 leading-relaxed">
                * Keterlambatan pengembalian buku dikenakan sanksi denda sebesar{' '}
                <b>{formatRupiah(settings.finePerDay)} per hari</b>. Harap menjaga kondisi fisik buku dengan baik.
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-xs text-center text-slate-600">
                <div>
                  <p className="text-[10px]">Peminjam,</p>
                  <div className="h-10" />
                  <p className="font-semibold text-slate-800">({data.loan.memberName})</p>
                </div>
                <div>
                  <p className="text-[10px]">Petugas Perpustakaan,</p>
                  <div className="h-10" />
                  <p className="font-semibold text-slate-800">({settings.headLibrarian})</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 4: RETURN & FINE RECEIPT */}
          {type === 'return-receipt' && data.loan && (
            <div className="max-w-md mx-auto bg-white p-6 border border-slate-300 rounded-xl space-y-4 print:border-none print:p-0 print:max-w-none">
              <div className="text-center border-b border-slate-300 pb-3">
                <h3 className="font-bold text-sm text-slate-900 uppercase">
                  KUITANSI BUKTI PENGEMBALIAN & DENDA
                </h3>
                <p className="text-xs font-semibold text-slate-700">{settings.libraryName}</p>
                <p className="text-[10px] text-slate-500">{settings.schoolName}</p>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Transaksi:</span>
                  <span className="font-mono font-bold">{data.loan.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peminjam:</span>
                  <span className="font-semibold">{data.loan.memberName} ({data.loan.memberClass})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buku:</span>
                  <span className="font-bold text-right max-w-[220px]">{data.loan.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tgl. Dikembalikan:</span>
                  <span className="font-semibold">{formatDateIndo(data.loan.returnDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kondisi Pengembalian:</span>
                  <span>{data.loan.returnCondition || 'Baik'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Keterlambatan:</span>
                  <span>{data.loan.overdueDays} Hari</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center font-bold text-sm">
                  <span>TOTAL DENDA DIBAYARKAN:</span>
                  <span className="text-emerald-700">{formatRupiah(data.loan.fineAmount)}</span>
                </div>

                <div className="text-[11px] text-center text-emerald-700 font-semibold bg-emerald-50 py-1 rounded">
                  Status: {data.loan.finePaid ? 'LUNAS DI TEMPAT' : 'TERTUNGGAK'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-xs text-center text-slate-600">
                <div>
                  <p className="text-[10px]">Penyetor,</p>
                  <div className="h-10" />
                  <p className="font-semibold text-slate-800">({data.loan.memberName})</p>
                </div>
                <div>
                  <p className="text-[10px]">Penerima (Petugas),</p>
                  <div className="h-10" />
                  <p className="font-semibold text-slate-800">({settings.headLibrarian})</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 5: OFFICIAL MONTHLY REPORT */}
          {type === 'monthly-report' && data.allBooks && (
            <div className="space-y-6 text-slate-900">
              {/* Kop Surat Sekolah */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-base font-extrabold uppercase tracking-wide">
                  PEMERINTAH PROVINSI / KEMENTERIAN PENDIDIKAN
                </h2>
                <h3 className="text-lg font-black uppercase text-emerald-950">
                  {settings.schoolName}
                </h3>
                <h4 className="text-sm font-bold uppercase text-slate-700">
                  {settings.libraryName}
                </h4>
                <p className="text-xs text-slate-600">
                  NPSN: {settings.npsn} • Alamat: {settings.address}
                </p>
              </div>

              <div className="text-center">
                <h4 className="text-sm font-bold uppercase underline">
                  LAPORAN REKAPITULASI INVENTARIS & SIRKULASI PERPUSTAKAAN
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {data.period ? `Periode: ${getPeriodLabel(data.period)}` : 'Periode Tahun Ajaran Berjalan'}
                </p>
              </div>

              {/* Ringkasan Angka */}
              <div className="grid grid-cols-4 gap-3 text-xs border border-slate-300 p-3 rounded-lg text-center">
                <div>
                  <span className="text-slate-500 block">Total Koleksi Judul</span>
                  <span className="font-extrabold text-base">{data.allBooks.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Eksemplar Fisik</span>
                  <span className="font-extrabold text-base">
                    {data.allBooks.reduce((a, b) => a + b.totalCopies, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sirkulasi Dipinjam</span>
                  <span className="font-extrabold text-base">{data.loans?.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Kas Denda</span>
                  <span className="font-extrabold text-base">
                    {formatRupiah(
                      data.loans
                        ?.filter((l) => l.finePaid)
                        .reduce((a, b) => a + b.fineAmount, 0) || 0
                    )}
                  </span>
                </div>
              </div>

              {/* Tabel Koleksi Singkat */}
              <div>
                <h5 className="font-bold text-xs mb-2">Daftar Koleksi Buku Perpustakaan:</h5>
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="p-2 border-r border-slate-300">No Panggil</th>
                      <th className="p-2 border-r border-slate-300">Judul Buku</th>
                      <th className="p-2 border-r border-slate-300">Pengarang</th>
                      <th className="p-2 border-r border-slate-300">Klasifikasi DDC</th>
                      <th className="p-2 text-center">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.allBooks.slice(0, 15).map((book) => (
                      <tr key={book.id}>
                        <td className="p-2 font-mono border-r border-slate-200">{book.callNumber}</td>
                        <td className="p-2 font-semibold border-r border-slate-200">{book.title}</td>
                        <td className="p-2 border-r border-slate-200">{book.author}</td>
                        <td className="p-2 border-r border-slate-200">{book.category}</td>
                        <td className="p-2 text-center font-bold">{book.totalCopies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lembar Tanda Tangan Pengesahan */}
              <div className="pt-8 flex justify-between text-xs text-center text-slate-800 print:break-inside-avoid">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Kepala {settings.schoolName}</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{settings.headmaster}</p>
                  <p className="text-[10px] text-slate-500">NIP. 19710312 199802 1 003</p>
                </div>

                <div>
                  <p>Dibuat Oleh,</p>
                  <p className="font-semibold">Kepala Perpustakaan</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{settings.headLibrarian}</p>
                  <p className="text-[10px] text-slate-500">NIP. {settings.librarianNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 6: BLANK MEMBER REGISTRATION FORM */}
          {type === 'blank-member-form' && (
            <div className="space-y-6 text-slate-900 text-xs">
              {/* Kop Surat Madrasah */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h3 className="text-sm font-bold uppercase text-slate-700">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
                <h2 className="text-base font-extrabold uppercase">{settings.schoolName}</h2>
                <h4 className="text-sm font-bold uppercase text-emerald-800">{settings.libraryName}</h4>
                <p className="text-[11px] text-slate-600">Alamat: {settings.address} • NPSN: {settings.npsn}</p>
              </div>

              <div className="text-center">
                <h4 className="text-sm font-bold uppercase underline">FORMULIR PENDAFTARAN ANGGOTA PERPUSTAKAAN</h4>
                <p className="text-[11px] text-slate-500">Silakan isi formulir dengan huruf kapital secara lengkap dan jelas</p>
              </div>

              {/* Data isian kotak */}
              <div className="flex gap-6 items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Nomor Induk (NISN / NIP)</span>
                    <span className="col-span-2 font-mono text-slate-400">: [ . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ]</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Nama Lengkap</span>
                    <span className="col-span-2 text-slate-400">: ............................................................................</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Status Keanggotaan</span>
                    <span className="col-span-2 text-slate-700">: ( ) Siswa &nbsp;&nbsp;&nbsp;&nbsp; ( ) Guru &nbsp;&nbsp;&nbsp;&nbsp; ( ) Tenaga Kependidikan / Staf</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Kelas / Unit Kerja</span>
                    <span className="col-span-2 text-slate-400">: ............................................................................</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Jenis Kelamin</span>
                    <span className="col-span-2 text-slate-700">: ( ) Laki-laki &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ( ) Perempuan</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Tempat, Tanggal Lahir</span>
                    <span className="col-span-2 text-slate-400">: ...................................., ..... / ..... / .........</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Alamat Tempat Tinggal</span>
                    <span className="col-span-2 text-slate-400">: ............................................................................</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">No. WhatsApp / HP</span>
                    <span className="col-span-2 text-slate-400">: ............................................................................</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Alamat Email</span>
                    <span className="col-span-2 text-slate-400">: ............................................................................</span>
                  </div>
                </div>

                {/* Pas Foto Box */}
                <div className="w-28 h-36 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-center p-2 text-slate-400 shrink-0">
                  <span className="text-[11px] font-bold">Pas Foto</span>
                  <span className="text-[10px]">3 x 4 cm</span>
                </div>
              </div>

              {/* Tata tertib */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] space-y-1">
                <span className="font-bold block text-slate-800">PERNYATAAN ANGGOTA PERPUSTAKAAN:</span>
                <p className="text-slate-600 leading-relaxed">
                  Dengan menandatangani formulir ini, saya bersedia mematuhi seluruh peraturan perpustakaan MA Roudlotul Jadid, menjaga keutuhan buku yang dipinjam, mengembalikan tepat waktu, dan bersedia mengganti atau membayar denda Rp {settings.finePerDay.toLocaleString('id-ID')}/hari apabila terlambat.
                </p>
              </div>

              {/* Tanda tangan */}
              <div className="pt-6 flex justify-between text-xs text-center text-slate-800 print:break-inside-avoid">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Petugas Loket Pendaftaran</p>
                  <div className="h-16" />
                  <p className="font-bold underline">( {settings.headLibrarian} )</p>
                  <p className="text-[10px] text-slate-500">NIP. {settings.librarianNip}</p>
                </div>

                <div>
                  <p>Probolinggo, ......................... 20...</p>
                  <p className="font-semibold">Pemohon Pendaftaran,</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-400">( .................................................... )</p>
                  <p className="text-[10px] text-slate-500">Tanda tangan & nama terang</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 7: BLANK BOOK INVENTORY SHEET */}
          {type === 'blank-book-form' && (
            <div className="space-y-5 text-slate-900 text-xs">
              {/* Kop Surat Madrasah */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h3 className="text-sm font-bold uppercase text-slate-700">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
                <h2 className="text-base font-extrabold uppercase">{settings.schoolName}</h2>
                <h4 className="text-sm font-bold uppercase text-emerald-800">{settings.libraryName}</h4>
                <p className="text-[11px] text-slate-600">Alamat: {settings.address} • NPSN: {settings.npsn}</p>
              </div>

              <div className="text-center">
                <h4 className="text-sm font-bold uppercase underline">LEMBAR BLANKO INVENTARISASI & PENGADAAN BUKU KOLEKSI</h4>
                <p className="text-[11px] text-slate-500">Format formulir fisik pencatatan buku masuk sebelum digitalisasi katalog</p>
              </div>

              {/* Tabel entri kosong */}
              <table className="w-full text-left text-[11px] border border-slate-400">
                <thead className="bg-slate-100 border-b border-slate-400 font-bold text-center">
                  <tr>
                    <th className="p-1.5 border-r border-slate-400 w-8">No</th>
                    <th className="p-1.5 border-r border-slate-400 w-28">Judul Buku</th>
                    <th className="p-1.5 border-r border-slate-400 w-24">Pengarang</th>
                    <th className="p-1.5 border-r border-slate-400 w-20">Penerbit & Thn</th>
                    <th className="p-1.5 border-r border-slate-400 w-16">DDC / Rak</th>
                    <th className="p-1.5 border-r border-slate-400 w-10">Eks</th>
                    <th className="p-1.5 border-r border-slate-400 w-14">Sumber</th>
                    <th className="p-1.5 border-r border-slate-400 w-16">Harga</th>
                    <th className="p-1.5 w-16">Paraf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} className="h-9">
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono text-slate-400">{i + 1}</td>
                      <td className="p-1.5 border-r border-slate-300"></td>
                      <td className="p-1.5 border-r border-slate-300"></td>
                      <td className="p-1.5 border-r border-slate-300"></td>
                      <td className="p-1.5 border-r border-slate-300"></td>
                      <td className="p-1.5 border-r border-slate-300 text-center"></td>
                      <td className="p-1.5 border-r border-slate-300"></td>
                      <td className="p-1.5 border-r border-slate-300"></td>
                      <td className="p-1.5 text-center"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tanda tangan verifikasi */}
              <div className="pt-6 flex justify-between text-xs text-center text-slate-800 print:break-inside-avoid">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Kepala Perpustakaan</p>
                  <div className="h-14" />
                  <p className="font-bold underline">{settings.headLibrarian}</p>
                  <p className="text-[10px] text-slate-500">NIP. {settings.librarianNip}</p>
                </div>

                <div>
                  <p>Probolinggo, ......................... 20...</p>
                  <p className="font-semibold">Petugas Kataloger & Inventaris</p>
                  <div className="h-14" />
                  <p className="font-bold text-slate-400">( .................................................... )</p>
                  <p className="text-[10px] text-slate-500">Tanda tangan & nama petugas</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
