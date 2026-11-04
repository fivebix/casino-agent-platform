import {
  addDays,
  format,
  isTuesday,
  parseISO,
  previousTuesday,
  setHours,
  startOfHour,
} from 'date-fns';
import type { Week, WeekStart } from '@/types/agent';

/**
 * Client-side fallback for the betting week (Tuesday 11:00 → next Tuesday 11:00), used only to label the
 * week switcher before the server answers. The server's `Week` object is the source of truth.
 */
export const getLocalWeekRange = (now: Date = new Date()): { start: Date; end: Date } => {
  const todayAt11 = startOfHour(setHours(now, 11));
  let start: Date;
  if (isTuesday(now)) {
    start = now >= todayAt11 ? todayAt11 : startOfHour(setHours(previousTuesday(now), 11));
  } else {
    start = startOfHour(setHours(previousTuesday(now), 11));
  }
  return { start, end: addDays(start, 7) };
};

export const toWeekStart = (date: Date): WeekStart => format(date, 'yyyy-MM-dd');

/**
 * `weekStart` (YYYY-MM-DD) of the week `offset` weeks before the current one (0 = current), from the local
 * clock. For screens whose response has no `Week` object (Casino List, Bet List, Chance); the backend
 * accepts any day of the week and snaps it to that week's Tuesday.
 */
export const weekStartWithOffset = (offset: number, now: Date = new Date()): WeekStart =>
  toWeekStart(addDays(getLocalWeekRange(now).start, -7 * offset));

/** Builds a `Week` for `WeekSwitcher` from a local `weekStart` (undefined = current week). */
export const buildLocalWeek = (weekStart?: WeekStart, now: Date = new Date()): Week => {
  const current = getLocalWeekRange(now).start;
  const requested = weekStart ? startOfHour(setHours(parseISO(weekStart), 11)) : current;
  const start = requested > current ? current : requested;
  const isCurrent = toWeekStart(start) === toWeekStart(current);
  const end = addDays(start, 7);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    weekStart: toWeekStart(start),
    isCurrent,
    previous: toWeekStart(addDays(start, -7)),
    next: isCurrent ? null : toWeekStart(end),
  };
};
