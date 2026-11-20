import { LOCALES, type Lang } from './i18n';

export function durationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins} min`;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface UpcomingDate {
  value: string;
  label: string;
}

const TODAY: Record<Lang, string> = { es: 'Hoy', pt: 'Hoje', en: 'Today' };
const TOMORROW: Record<Lang, string> = { es: 'Mañana', pt: 'Amanhã', en: 'Tomorrow' };

export function getUpcomingDates(count: number, openDays: number[], lang: Lang = 'es'): UpcomingDate[] {
  const dates: UpcomingDate[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const weekdayShort = new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'short' });

  for (let offset = 0; offset < 60 && dates.length < count; offset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    if (openDays.length > 0 && !openDays.includes(day.getDay())) continue;

    let label: string;
    if (offset === 0) label = TODAY[lang];
    else if (offset === 1) label = TOMORROW[lang];
    else {
      const wd = weekdayShort.format(day).replace('.', '');
      label = `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${day.getDate()}`;
    }
    dates.push({ value: toDateStr(day), label });
  }

  return dates;
}

export function formatDateLong(dateStr: string, lang: Lang = 'es'): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat(LOCALES[lang], {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

export function formatShortDate(dateStr: string, lang: Lang = 'es'): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat(LOCALES[lang], {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(date).replace('.', '');
}

// Bolivian mobile: 8 digits, grouped 3-2-3 (e.g. 700 12 345).
// Other country codes: up to 12 digits, grouped in blocks of 3.
export function formatPhoneInput(raw: string, countryCode = '591'): string {
  if (countryCode === '591') {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDaysStr(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}