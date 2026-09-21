// Date helpers for the calendar view. All computations are in local time.

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Local-time key "yyyy-mm-dd" used to group moments by day. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 42 cells (6 weeks × 7 days) covering the given month, starting on Sunday.
 * Includes leading/trailing days from adjacent months.
 */
export function getMonthCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - startOffset + i));
  }
  return cells;
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** "September 2026" */
export function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** "Monday, September 21" */
export function fullDayTitle(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
