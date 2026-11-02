export type TimePeriod = 'week' | 'month' | 'year' | 'all';

/**
 * Checks if a given date string (YYYY-MM-DD or ISO) falls within the selected period
 * Relative to reference date (default: today)
 */
export function isDateInPeriod(dateStr?: string, period: TimePeriod = 'all', refDate: Date = new Date()): boolean {
  if (!dateStr || period === 'all') return true;

  try {
    const target = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

    if (isNaN(target.getTime())) return true;

    if (period === 'year') {
      return target.getFullYear() === ref.getFullYear();
    }

    if (period === 'month') {
      return (
        target.getFullYear() === ref.getFullYear() &&
        target.getMonth() === ref.getMonth()
      );
    }

    if (period === 'week') {
      // Current calendar week (Monday to Sunday)
      const day = ref.getDay(); // 0 is Sun, 1 is Mon
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(ref);
      monday.setDate(ref.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return target >= monday && target <= sunday;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Returns human-readable label for the period in Indonesian
 */
export function getPeriodLabel(period: TimePeriod, refDate: Date = new Date()): string {
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (period === 'week') {
    const day = refDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return `Minggu Ini (${monday.getDate()} - ${sunday.getDate()} ${monthsIndo[sunday.getMonth()]} ${sunday.getFullYear()})`;
  }

  if (period === 'month') {
    return `Bulan Ini (${monthsIndo[refDate.getMonth()]} ${refDate.getFullYear()})`;
  }

  if (period === 'year') {
    return `Tahun Ini (${refDate.getFullYear()})`;
  }

  return 'Semua Waktu (Keseluruhan Data)';
}
