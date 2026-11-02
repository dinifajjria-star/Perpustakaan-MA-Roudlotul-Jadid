export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDaysOverdue(dueDateStr: string, returnDateStr?: string): number {
  const targetDate = returnDateStr ? new Date(returnDateStr + 'T00:00:00') : new Date();
  const dueDate = new Date(dueDateStr + 'T00:00:00');
  
  // Set to midnight for accurate day comparison
  targetDate.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function getCategoryBadgeClass(category: string): string {
  if (category.includes('Kurikulum Merdeka')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (category.startsWith('000')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  if (category.startsWith('100')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (category.startsWith('200')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (category.startsWith('300')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (category.startsWith('400')) return 'bg-teal-50 text-teal-700 border-teal-200';
  if (category.startsWith('500')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (category.startsWith('600')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (category.startsWith('700')) return 'bg-pink-50 text-pink-700 border-pink-200';
  if (category.startsWith('800')) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (category.startsWith('900')) return 'bg-stone-100 text-stone-700 border-stone-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}
