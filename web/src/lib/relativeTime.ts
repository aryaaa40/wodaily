const formatter = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Mengubah ISO timestamp menjadi teks relatif berbahasa Indonesia.
 * Selisih di bawah satu menit dianggap "baru saja".
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);

  if (Number.isNaN(diff)) return '';
  if (abs < MINUTE) return 'baru saja';
  if (abs < HOUR) return formatter.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return formatter.format(Math.round(diff / HOUR), 'hour');
  if (abs < WEEK) return formatter.format(Math.round(diff / DAY), 'day');
  if (abs < MONTH) return formatter.format(Math.round(diff / WEEK), 'week');
  if (abs < YEAR) return formatter.format(Math.round(diff / MONTH), 'month');
  return formatter.format(Math.round(diff / YEAR), 'year');
}
