import {
  addDays,
  format,
  isTuesday,
  parseISO,
  previousTuesday,
  setHours,
  startOfHour,
} from 'date-fns';
import { fromZonedWall, toZonedWall } from '@/lib/timezone';
import type { Week, WeekStart } from '@/types/agent';

/** Tuesday 11:00 at or before `wall` (local fields = the agent's wall clock). */
const weekWallStart = (wall: Date): Date => {
  const todayAt11 = startOfHour(setHours(wall, 11));
  if (isTuesday(wall) && wall >= todayAt11) return todayAt11;
  return startOfHour(setHours(isTuesday(wall) ? addDays(wall, -7) : previousTuesday(wall), 11));
};

/**
 * Client-side fallback for the betting week (Tuesday 11:00 → next Tuesday 11:00 in the signed-in agent's time
 * zone), used only to label the week switcher before the server answers. The server's `Week` object is the source
 * of truth. `start` / `end` are real instants.
 */
export const getLocalWeekRange = (now: Date = new Date()): { start: Date; end: Date } => {
  const start = weekWallStart(toZonedWall(now));
  return { start: fromZonedWall(start), end: fromZonedWall(addDays(start, 7)) };
};

const toKey = (wall: Date): WeekStart => format(wall, 'yyyy-MM-dd');

export const toWeekStart = (date: Date): WeekStart => toKey(toZonedWall(date));

/**
 * `weekStart` (YYYY-MM-DD) of the week `offset` weeks before the current one (0 = current), on the agent's clock.
 * For screens whose response has no `Week` object (Casino List, Bet List, Chance); the backend accepts any day of
 * the week and snaps it to that week's Tuesday.
 */
export const weekStartWithOffset = (offset: number, now: Date = new Date()): WeekStart =>
  toKey(addDays(weekWallStart(toZonedWall(now)), -7 * offset));

/** Builds a `Week` for `WeekSwitcher` from a `weekStart` (undefined = current week), on the agent's clock. */
export const buildLocalWeek = (weekStart?: WeekStart, now: Date = new Date()): Week => {
  const current = weekWallStart(toZonedWall(now));
  const requested = weekStart ? startOfHour(setHours(parseISO(weekStart), 11)) : current;
  const start = requested > current ? current : requested;
  const isCurrent = toKey(start) === toKey(current);
  const end = addDays(start, 7);
  return {
    start: fromZonedWall(start).toISOString(),
    end: fromZonedWall(end).toISOString(),
    weekStart: toKey(start),
    isCurrent,
    previous: toKey(addDays(start, -7)),
    next: isCurrent ? null : toKey(end),
  };
};
