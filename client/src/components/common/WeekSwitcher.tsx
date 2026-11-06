'use client';

import { Button } from '@/components/ui/button';
import { formatDayMonth, formatShortDateTime } from '@/lib/format';
import { getLocalWeekRange } from '@/lib/week';
import { cn } from '@/lib/utils';
import type { Week, WeekStart } from '@/types/agent';

type Props = {
  /** The `week` object from a list response. Undefined while loading → shows the local current week. */
  week?: Week;
  /** Called with `week.previous` / `week.next`. */
  onChange: (weekStart: WeekStart) => void;
  disabled?: boolean;
  className?: string;
};

/** `Previous  27.10 - 03.11  Next` — Next is disabled on the current week (`week.next === null`). */
const WeekSwitcher = ({ week, onChange, disabled, className }: Props) => {
  const fallback = week ? null : getLocalWeekRange();
  const start = week?.start ?? fallback?.start;
  const end = week?.end ?? fallback?.end;
  // Test-server close cycles (keyed from 1900) last minutes, not a week: show the times too.
  const fmt = week && week.weekStart < '2000-01-01' ? formatShortDateTime : formatDayMonth;

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || !week}
        onClick={() => week && onChange(week.previous)}
      >
        Previous
      </Button>
      <span className="whitespace-nowrap px-0.5 text-sm text-foreground">
        {fmt(start)}
        <span className="mx-2 text-muted">-</span>
        {fmt(end)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || !week?.next}
        onClick={() => week?.next && onChange(week.next)}
      >
        Next
      </Button>
    </div>
  );
};

export default WeekSwitcher;
