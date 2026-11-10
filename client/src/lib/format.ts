import { format, isValid, parseISO } from 'date-fns';
import { toZonedWall } from '@/lib/timezone';

/** Money / figures as the designs show them: no thousands separator, at most 2 decimals (5000, -5, 12.5). */
export const formatAmount = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
};

/** Signed figure for P/L columns: `+25`, `-20`, `0`. */
export const formatSigned = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value > 0 ? `+${formatAmount(value)}` : formatAmount(value);
};

export const formatPercent = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : `${formatAmount(value)}%`;

/** The instant as the signed-in agent's wall clock (its time zone), ready for `format`. */
const toDate = (value: string | Date): Date | null => {
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? toZonedWall(d) : null;
};

/** `21.09 19:30` — bet tables. */
export const formatShortDateTime = (value: string | Date | null | undefined): string => {
  const d = value ? toDate(value) : null;
  return d ? format(d, 'dd.MM HH:mm') : '—';
};

/** `27.10` — week switcher. */
export const formatDayMonth = (value: string | Date | null | undefined): string => {
  const d = value ? toDate(value) : null;
  return d ? format(d, 'dd.MM') : '—';
};

/** `21:57 25.09.26` — user edit subtitle. */
export const formatTimeDate = (value: string | Date | null | undefined): string => {
  const d = value ? toDate(value) : null;
  return d ? format(d, 'HH:mm dd.MM.yy') : '—';
};

/** `21:12:13` — Bets online BET DATE. */
export const formatTimeWithSeconds = (value: string | Date | null | undefined): string => {
  const d = value ? toDate(value) : null;
  return d ? format(d, 'HH:mm:ss') : '—';
};

/** `19:30:37 21.09` — Bet details dates. */
export const formatTimeSecondsDayMonth = (value: string | Date | null | undefined): string => {
  const d = value ? toDate(value) : null;
  return d ? format(d, 'HH:mm:ss dd.MM') : '—';
};

/** `{ time: '22:31', day: '24.09' }` — two-line DATE / TIME cells in the bet tables. */
export const splitTimeDay = (
  value: string | Date | null | undefined,
): { time: string; day: string } | null => {
  const d = value ? toDate(value) : null;
  return d ? { time: format(d, 'HH:mm'), day: format(d, 'dd.MM') } : null;
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Decimal odds in the agent's odds format (design 30): decimal `1.91`, American `+187` / `-110`,
 * fractional `5/4`.
 */
export const formatOdds = (
  decimal: number | null | undefined,
  oddsFormat: 'decimal' | 'american' | 'fractional',
): string => {
  if (decimal === null || decimal === undefined || Number.isNaN(decimal) || decimal <= 1)
    return '-';
  if (oddsFormat === 'decimal') return decimal.toFixed(2);
  if (oddsFormat === 'american') {
    return decimal >= 2
      ? `+${Math.round((decimal - 1) * 100)}`
      : `-${Math.round(100 / (decimal - 1))}`;
  }
  const num = Math.round((decimal - 1) * 100);
  const div = gcd(num, 100);
  return `${num / div}/${100 / div}`;
};
