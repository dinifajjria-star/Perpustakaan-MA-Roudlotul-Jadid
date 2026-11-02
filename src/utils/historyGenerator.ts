import { Book, Member, LoanTransaction, VisitorLog, LibrarySettings, AdminUser, LoanCycleEvent } from '../types/library';
import { calculateDaysOverdue } from './formatters';

interface GenerateOptions {
  startDate?: string; // YYYY-MM-DD, default '2026-01-01'
  endDate?: string;   // YYYY-MM-DD, default '2026-11-01'
  settings?: LibrarySettings;
  admins?: AdminUser[];
}

/**
 * Checks if a given date string is Friday (Jumat).
 * In this library schedule, Friday is strictly a holiday (LIBUR).
 * Sunday is a normal school day (MASUK SEKOLAH).
 */
export function isFridayHoliday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 5; // 5 = Friday
}

/**
 * Checks if a date is a school day.
 * Friday (5) = LIBUR (false)
 * Sunday (0), Monday (1), Tuesday (2), Wednesday (3), Thursday (4), Saturday (6) = MASUK (true)
 */
export function isSchoolDay(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() !== 5;
}

/**
 * Ensures a date string does not land on Friday.
 * If it lands on Friday, shifts it forward to Saturday (+1 day).
 */
export function adjustIfFriday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (d.getDay() === 5) {
    d.setDate(d.getDate() + 1); // Move to Saturday
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds days to a date string (YYYY-MM-DD)
 */
function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates all active school dates from startDate to endDate
 * Excludes every Friday (Jumat = Libur), includes Sunday (Minggu = Masuk).
 */
export function getSchoolDaysInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  const cur = new Date(start);
  while (cur <= end) {
    // 0 = Sunday (Masuk), 1-4 = Mon-Thu (Masuk), 5 = Friday (LIBUR!), 6 = Saturday (Masuk)
    if (cur.getDay() !== 5) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(cur.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    cur.setDate(cur.getDate() + 1);
  }

  return dates;
}

/**
 * Generates realistic randomized visitor logs and loan transactions
 * from January 1, 2026 until today (November 1, 2026) using all existing members and books.
 * Friday is strictly holiday; Sunday is active school day.
 */
export function generateLibraryHistory(
  members: Member[],
  books: Book[],
  options?: GenerateOptions
): {
  visitors: VisitorLog[];
  loans: LoanTransaction[];
  updatedBooks: Book[];
} {
  const startDate = options?.startDate || '2026-01-01';
  const endDate = options?.endDate || '2026-11-02';
  const finePerDay = options?.settings?.finePerDay || 2000;
  const maxBorrowDaysStudent = options?.settings?.maxBorrowDaysStudent || 7;
  const maxBorrowDaysTeacher = options?.settings?.maxBorrowDaysTeacher || 14;

  const officers = options?.admins && options.admins.length > 0
    ? options.admins.map((a) => a.name)
    : [
        'Siti Rahmawati, S.I.Pust.',
        'M. Fajar Shodiq, S.Pd.I.',
        'Nur Aini, A.Ma.'
      ];

  const schoolDays = getSchoolDaysInRange(startDate, endDate);

  const visitorPurposes: VisitorLog['purpose'][] = [
    'Membaca di Tempat',
    'Meminjam / Mengembalikan',
    'Mencari Referensi Tugas',
    'Diskusi Kelompok',
    'Lainnya',
  ];

  const purposeWeights = [0.35, 0.28, 0.20, 0.12, 0.05];

  function pickPurpose(): VisitorLog['purpose'] {
    const r = Math.random();
    let sum = 0;
    for (let i = 0; i < visitorPurposes.length; i++) {
      sum += purposeWeights[i];
      if (r <= sum) return visitorPurposes[i];
    }
    return 'Membaca di Tempat';
  }

  const timeSlots = [
    '07:35', '07:50', '08:15', '08:40', '09:10', '09:35', '09:50',
    '10:15', '10:45', '11:10', '11:35', '12:05', '12:40', '13:15',
    '13:50', '14:20', '14:45', '15:15'
  ];

  const guestNames = [
    { name: 'Drs. H. Mulyadi (Pengawas Madrasah)', role: 'Tamu Umum' as const, classOrDept: 'Kemenag Kab. Probolinggo' },
    { name: 'Ibu Hj. Aminah, S.Ag. (Wali Murid)', role: 'Tamu Umum' as const, classOrDept: 'Komite Madrasah' },
    { name: 'Rahmat Hidayat (Alumni 2024)', role: 'Tamu Umum' as const, classOrDept: 'Alumni / Mahasiswa UIN' },
    { name: 'Siti Maisaroh (Wali Siswa Kelas X)', role: 'Tamu Umum' as const, classOrDept: 'Wali Murid' },
    { name: 'Ahmad Zaki (PPL Mahasiswa UNUJA)', role: 'Tamu Umum' as const, classOrDept: 'Mahasiswa PPL' },
  ];

  const generatedVisitors: VisitorLog[] = [];
  const generatedLoans: LoanTransaction[] = [];

  let visitorCounter = 1;
  let loanCounter = 1;

  // Rotating cursors to guarantee every uploaded member and book is evenly represented across 2026
  let memberVisitCursor = 0;
  let memberLoanCursor = 0;
  let bookLoanCursor = 0;

  // Track active loans per book to avoid exceeding totalCopies
  const activeBookBorrowCounts: Record<string, number> = {};
  books.forEach((b) => {
    activeBookBorrowCounts[b.id] = 0;
  });

  // Calculate day difference
  function diffInDays(start: string, end: string): number {
    const d1 = new Date(start + 'T00:00:00').getTime();
    const d2 = new Date(end + 'T00:00:00').getTime();
    return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  }

  // Iterate over every school day from Jan 1, 2026 to Nov 2, 2026
  schoolDays.forEach((dateStr) => {
    const isRecentPeriod = dateStr >= '2026-10-18';

    // ----------------- A. VISITOR ATTENDANCE -----------------
    const visitsCount = 5 + Math.floor(Math.random() * 5);
    const usedTimes = new Set<string>();

    for (let i = 0; i < visitsCount; i++) {
      let chosenTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      if (usedTimes.has(chosenTime)) {
        const mins = String(10 + Math.floor(Math.random() * 45)).padStart(2, '0');
        const hour = String(7 + Math.floor(Math.random() * 8)).padStart(2, '0');
        chosenTime = `${hour}:${mins}`;
      }
      usedTimes.add(chosenTime);

      const isGuest = Math.random() < 0.07 && guestNames.length > 0;
      if (isGuest) {
        const guest = guestNames[Math.floor(Math.random() * guestNames.length)];
        generatedVisitors.push({
          id: `v-${visitorCounter++}`,
          date: dateStr,
          time: chosenTime,
          name: guest.name,
          role: guest.role,
          classOrDept: guest.classOrDept,
          purpose: pickPurpose(),
        });
      } else if (members.length > 0) {
        // Guarantee every member in the uploaded list is cycled through regularly
        const memberIdx = (memberVisitCursor + (Math.random() < 0.25 ? Math.floor(Math.random() * members.length) : 0)) % members.length;
        memberVisitCursor++;
        const member = members[memberIdx];

        generatedVisitors.push({
          id: `v-${visitorCounter++}`,
          date: dateStr,
          time: chosenTime,
          memberId: member.id,
          nisn_nip: member.nisn_nip,
          name: member.name,
          role: member.role,
          classOrDept: member.classOrDept,
          purpose: pickPurpose(),
        });
      }
    }

    // ----------------- B. BOOK BORROWING LOANS & CYCLES -----------------
    if (Math.random() < 0.85 && members.length > 0 && books.length > 0) {
      const dailyLoans = 1 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);

      for (let l = 0; l < dailyLoans; l++) {
        // Guarantee every member and book is cycled through actively
        const memberIdx = (memberLoanCursor + (Math.random() < 0.25 ? Math.floor(Math.random() * members.length) : 0)) % members.length;
        memberLoanCursor++;
        const member = members[memberIdx];

        const bookIdx = (bookLoanCursor + (Math.random() < 0.25 ? Math.floor(Math.random() * books.length) : 0)) % books.length;
        bookLoanCursor++;
        const book = books[bookIdx];

        const officer = officers[Math.floor(Math.random() * officers.length)];

        const borrowDays = member.role === 'Guru' || member.role === 'Staf'
          ? maxBorrowDaysTeacher
          : maxBorrowDaysStudent;

        const originalDueDate = adjustIfFriday(addDaysToDate(dateStr, borrowDays));
        let dueDate = originalDueDate;

        const yearMonthCode = dateStr.replace(/-/g, '').slice(0, 6);
        const codeNum = String(loanCounter).padStart(4, '0');
        const transactionCode = `TRX-${yearMonthCode}-${codeNum}`;
        const loanId = `trx-${Date.now()}-${loanCounter}`;
        loanCounter++;

        // Past loan (concluded before late October)
        if (!isRecentPeriod) {
          const outcomeRand = Math.random();
          const isRenewed = Math.random() < 0.22;
          let renewalCount = 0;

          if (isRenewed) {
            renewalCount = Math.random() < 0.8 ? 1 : 2;
            const extraDays = renewalCount * (member.role === 'Guru' ? 14 : 7);
            dueDate = adjustIfFriday(addDaysToDate(originalDueDate, extraDays));
          }

          if (outcomeRand < 0.88) {
            // Returned on time
            const daysUsed = Math.max(1, Math.min(borrowDays + (renewalCount * 7), 1 + Math.floor(Math.random() * (borrowDays + (renewalCount * 7)))));
            let returnDate = addDaysToDate(dateStr, daysUsed);
            returnDate = adjustIfFriday(returnDate);
            const durationDays = diffInDays(dateStr, returnDate);

            // Build Cycle History
            const cycleHistory: LoanCycleEvent[] = [
              {
                id: `cyc-${loanId}-1`,
                stage: 'Peminjaman Baru',
                date: dateStr,
                time: '08:30',
                note: `Peminjaman baru disetujui. Tenggat awal: ${originalDueDate}`,
                officer,
              },
            ];

            if (renewalCount >= 1) {
              const renDate1 = adjustIfFriday(addDaysToDate(dateStr, borrowDays - 1));
              cycleHistory.push({
                id: `cyc-${loanId}-2`,
                stage: 'Perpanjangan' as const,
                date: renDate1,
                time: '10:15',
                note: `Perpanjangan siklus ke-1 (+7 hari). Tenggat baru disahkan`,
                officer,
                daysExtended: 7,
                newDueDate: dueDate,
              });
            }

            if (renewalCount >= 2) {
              const renDate2 = adjustIfFriday(addDaysToDate(dateStr, borrowDays + 6));
              cycleHistory.push({
                id: `cyc-${loanId}-3`,
                stage: 'Perpanjangan' as const,
                date: renDate2,
                time: '11:00',
                note: `Perpanjangan siklus ke-2 (+7 hari). Batas maksimal tercapai`,
                officer,
                daysExtended: 7,
                newDueDate: dueDate,
              });
            }

            cycleHistory.push({
              id: `cyc-${loanId}-ret`,
              stage: 'Pengembalian Tepat Waktu' as const,
              date: returnDate,
              time: '12:30',
              note: 'Buku dikembalikan dalam kondisi baik dan tepat waktu.',
              officer,
            });

            cycleHistory.push({
              id: `cyc-${loanId}-end`,
              stage: 'Penyelesaian Siklus' as const,
              date: returnDate,
              time: '12:31',
              note: 'Siklus sirkulasi selesai. Eksemplar dikembalikan ke rak katalog.',
              officer,
            });

            generatedLoans.push({
              id: loanId,
              transactionCode,
              memberId: member.id,
              memberName: member.name,
              memberRole: member.role,
              memberClass: member.classOrDept,
              bookId: book.id,
              bookCode: book.code,
              bookTitle: book.title,
              bookCallNumber: book.callNumber,
              borrowDate: dateStr,
              originalDueDate,
              dueDate,
              returnDate,
              status: 'Kembali',
              renewalCount,
              maxRenewals: 2,
              cycleStatus: 'Selesai',
              cycleDurationDays: durationDays,
              overdueDays: 0,
              fineAmount: 0,
              finePaid: true,
              borrowCondition: 'Baik',
              returnCondition: 'Baik',
              officer,
              notes: renewalCount > 0 ? `Peminjaman selesai (${renewalCount}x perpanjangan siklus)` : 'Peminjaman selesai tepat waktu',
              cycleHistory,
            });
          } else if (outcomeRand < 0.98) {
            // Returned late (1 to 5 days overdue)
            const overdueDays = 1 + Math.floor(Math.random() * 5);
            let returnDate = addDaysToDate(dueDate, overdueDays);
            returnDate = adjustIfFriday(returnDate);
            const fine = overdueDays * finePerDay;
            const durationDays = diffInDays(dateStr, returnDate);

            const cycleHistory = [
              {
                id: `cyc-${loanId}-1`,
                stage: 'Peminjaman Baru' as const,
                date: dateStr,
                time: '09:00',
                note: `Peminjaman disetujui petugas. Tenggat: ${dueDate}`,
                officer,
              },
              {
                id: `cyc-${loanId}-warn`,
                stage: 'Peringatan Jatuh Tempo' as const,
                date: dueDate,
                time: '15:00',
                note: 'Tenggat waktu terlampaui. Status pinjam beralih ke keterlambatan.',
                officer,
              },
              {
                id: `cyc-${loanId}-ret`,
                stage: 'Terlambat & Denda' as const,
                date: returnDate,
                time: '11:15',
                note: `Pengembalian terlambat ${overdueDays} hari. Denda Rp ${fine.toLocaleString('id-ID')} lunas.`,
                officer,
              },
              {
                id: `cyc-${loanId}-end`,
                stage: 'Penyelesaian Siklus' as const,
                date: returnDate,
                time: '11:16',
                note: 'Denda disetor, buku selesai diverifikasi dan siap dipinjamkan kembali.',
                officer,
              },
            ];

            generatedLoans.push({
              id: loanId,
              transactionCode,
              memberId: member.id,
              memberName: member.name,
              memberRole: member.role,
              memberClass: member.classOrDept,
              bookId: book.id,
              bookCode: book.code,
              bookTitle: book.title,
              bookCallNumber: book.callNumber,
              borrowDate: dateStr,
              originalDueDate,
              dueDate,
              returnDate,
              status: 'Kembali',
              renewalCount: 0,
              maxRenewals: 2,
              cycleStatus: 'Denda Lunas',
              cycleDurationDays: durationDays,
              overdueDays,
              fineAmount: fine,
              finePaid: true,
              borrowCondition: 'Baik',
              returnCondition: Math.random() < 0.2 ? 'Rusak Ringan' : 'Baik',
              officer,
              notes: `Terlambat ${overdueDays} hari. Denda telah lunas dibayar.`,
              cycleHistory,
            });
          } else {
            // Damaged/minor issues handled
            let returnDate = addDaysToDate(dueDate, 2);
            returnDate = adjustIfFriday(returnDate);
            const durationDays = diffInDays(dateStr, returnDate);

            generatedLoans.push({
              id: loanId,
              transactionCode,
              memberId: member.id,
              memberName: member.name,
              memberRole: member.role,
              memberClass: member.classOrDept,
              bookId: book.id,
              bookCode: book.code,
              bookTitle: book.title,
              bookCallNumber: book.callNumber,
              borrowDate: dateStr,
              originalDueDate,
              dueDate,
              returnDate,
              status: 'Kembali',
              renewalCount: 0,
              maxRenewals: 2,
              cycleStatus: 'Selesai',
              cycleDurationDays: durationDays,
              overdueDays: 2,
              fineAmount: 4000,
              finePaid: true,
              borrowCondition: 'Baik',
              returnCondition: 'Rusak Ringan',
              officer,
              notes: 'Kondisi buku diselotip rapi pada punggung buku.',
              cycleHistory: [
                {
                  id: `cyc-${loanId}-1`,
                  stage: 'Peminjaman Baru' as const,
                  date: dateStr,
                  time: '08:15',
                  note: 'Peminjaman buku disetujui.',
                  officer,
                },
                {
                  id: `cyc-${loanId}-2`,
                  stage: 'Pengembalian Tepat Waktu' as const,
                  date: returnDate,
                  time: '13:00',
                  note: 'Buku dikembalikan, terdeteksi sobekan ringan telah diperbaiki.',
                  officer,
                },
                {
                  id: `cyc-${loanId}-3`,
                  stage: 'Penyelesaian Siklus' as const,
                  date: returnDate,
                  time: '13:05',
                  note: 'Siklus selesai. Buku kembali ke rak.',
                  officer,
                },
              ],
            });
          }
        } else {
          // Recent period (late October - November 2, 2026)
          const isOverdueTarget = dateStr <= '2026-10-23' && Math.random() < 0.35;
          const isAlreadyReturned = dateStr <= '2026-10-25' && Math.random() < 0.50;
          const isRenewedActive = !isOverdueTarget && !isAlreadyReturned && Math.random() < 0.3;

          let renewalCount = 0;
          if (isRenewedActive) {
            renewalCount = 1;
            dueDate = adjustIfFriday(addDaysToDate(originalDueDate, 7));
          }

          if (isAlreadyReturned) {
            let returnDate = addDaysToDate(dateStr, 3);
            returnDate = adjustIfFriday(returnDate);
            const durationDays = diffInDays(dateStr, returnDate);

            generatedLoans.push({
              id: loanId,
              transactionCode,
              memberId: member.id,
              memberName: member.name,
              memberRole: member.role,
              memberClass: member.classOrDept,
              bookId: book.id,
              bookCode: book.code,
              bookTitle: book.title,
              bookCallNumber: book.callNumber,
              borrowDate: dateStr,
              originalDueDate,
              dueDate,
              returnDate,
              status: 'Kembali',
              renewalCount: 0,
              maxRenewals: 2,
              cycleStatus: 'Selesai',
              cycleDurationDays: durationDays,
              overdueDays: 0,
              fineAmount: 0,
              finePaid: true,
              borrowCondition: 'Baik',
              returnCondition: 'Baik',
              officer,
              notes: 'Pengembalian tepat waktu',
              cycleHistory: [
                {
                  id: `cyc-${loanId}-1`,
                  stage: 'Peminjaman Baru' as const,
                  date: dateStr,
                  time: '08:45',
                  note: 'Peminjaman buku disetujui.',
                  officer,
                },
                {
                  id: `cyc-${loanId}-2`,
                  stage: 'Pengembalian Tepat Waktu' as const,
                  date: returnDate,
                  time: '11:00',
                  note: 'Buku dikembalikan utuh.',
                  officer,
                },
                {
                  id: `cyc-${loanId}-3`,
                  stage: 'Penyelesaian Siklus' as const,
                  date: returnDate,
                  time: '11:02',
                  note: 'Siklus sirkulasi ditutup.',
                  officer,
                },
              ],
            });
          } else if (isOverdueTarget) {
            // Currently Overdue!
            const overdueDays = Math.max(1, calculateDaysOverdue(dueDate, endDate));
            const fine = overdueDays * finePerDay;
            activeBookBorrowCounts[book.id] = (activeBookBorrowCounts[book.id] || 0) + 1;
            const durationDays = diffInDays(dateStr, endDate);

            generatedLoans.push({
              id: loanId,
              transactionCode,
              memberId: member.id,
              memberName: member.name,
              memberRole: member.role,
              memberClass: member.classOrDept,
              bookId: book.id,
              bookCode: book.code,
              bookTitle: book.title,
              bookCallNumber: book.callNumber,
              borrowDate: dateStr,
              originalDueDate,
              dueDate,
              status: 'Terlambat',
              renewalCount: 0,
              maxRenewals: 2,
              cycleStatus: 'Jatuh Tempo',
              cycleDurationDays: durationDays,
              overdueDays,
              fineAmount: fine,
              finePaid: false,
              borrowCondition: 'Baik',
              officer,
              notes: 'Peminjaman masih berjalan (melebihi tenggat waktu)',
              cycleHistory: [
                {
                  id: `cyc-${loanId}-1`,
                  stage: 'Peminjaman Baru' as const,
                  date: dateStr,
                  time: '09:15',
                  note: `Peminjaman awal. Tenggat kembali: ${dueDate}`,
                  officer,
                },
                {
                  id: `cyc-${loanId}-warn`,
                  stage: 'Peringatan Jatuh Tempo' as const,
                  date: dueDate,
                  time: '15:00',
                  note: `Batas akhir terlampaui. Menunggu pengembalian buku dan penyelesaian denda.`,
                  officer,
                },
              ],
            });
          } else {
            // Currently Dipinjam (active, safe)
            activeBookBorrowCounts[book.id] = (activeBookBorrowCounts[book.id] || 0) + 1;
            const durationDays = diffInDays(dateStr, endDate);

            const cycleHistory: LoanCycleEvent[] = [
              {
                id: `cyc-${loanId}-1`,
                stage: 'Peminjaman Baru',
                date: dateStr,
                time: '10:00',
                note: `Peminjaman baru disetujui. Tenggat: ${originalDueDate}`,
                officer,
              },
            ];

            if (renewalCount > 0) {
              cycleHistory.push({
                id: `cyc-${loanId}-ren`,
                stage: 'Perpanjangan' as const,
                date: adjustIfFriday(addDaysToDate(dateStr, borrowDays - 1)),
                time: '10:30',
                note: `Perpanjangan siklus ke-1 (+7 hari). Tenggat baru: ${dueDate}`,
                officer,
                daysExtended: 7,
                newDueDate: dueDate,
              });
            }

            generatedLoans.push({
              id: loanId,
              transactionCode,
              memberId: member.id,
              memberName: member.name,
              memberRole: member.role,
              memberClass: member.classOrDept,
              bookId: book.id,
              bookCode: book.code,
              bookTitle: book.title,
              bookCallNumber: book.callNumber,
              borrowDate: dateStr,
              originalDueDate,
              dueDate,
              status: 'Dipinjam',
              renewalCount,
              maxRenewals: 2,
              cycleStatus: renewalCount > 0 ? 'Diperpanjang' : 'Berjalan',
              cycleDurationDays: durationDays,
              overdueDays: 0,
              fineAmount: 0,
              finePaid: false,
              borrowCondition: 'Baik',
              officer,
              notes: renewalCount > 0 ? 'Masa peminjaman aktif (diperpanjang 1x)' : 'Dalam masa peminjaman aktif',
              cycleHistory,
            });
          }
        }
      }
    }
  });

  // Sort visitors descending (most recent first)
  generatedVisitors.sort((a, b) => {
    const comp = b.date.localeCompare(a.date);
    if (comp !== 0) return comp;
    return b.time.localeCompare(a.time);
  });

  // Sort loans descending (most recent first)
  generatedLoans.sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));

  // Synchronize availableCopies on books based on active loans
  const updatedBooks = books.map((b) => {
    const activeBorrowed = activeBookBorrowCounts[b.id] || 0;
    const available = Math.max(0, b.totalCopies - activeBorrowed);
    return {
      ...b,
      availableCopies: available,
    };
  });

  return {
    visitors: generatedVisitors,
    loans: generatedLoans,
    updatedBooks,
  };
}
