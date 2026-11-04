import { formatAmount, formatDayMonth, formatTimeDate } from '@/lib/format';
import type { AgentSummary, Week } from '@/types/agent';

type Props = {
  week: Week;
  summary?: AgentSummary;
};

/** Design 24: shown above the table on a past (closed) week. */
const WeekClosedBanner = ({ week, summary }: Props) => (
  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xs border border-lime/70 bg-lime/5 px-4 py-2.5 text-sm">
    <span className="rounded-xs bg-lime px-2 py-0.5 text-[10px] font-extrabold tracking-[0.08em] text-lime-ink">
      WEEK CLOSED
    </span>
    <span className="font-bold">
      Week summary {formatDayMonth(week.start)} → {formatDayMonth(week.end)}
    </span>
    <span className="text-muted">
      settled {formatTimeDate(week.end)} · all bets below are closed, credits reset
    </span>
    {summary && (
      <span className="ml-auto flex flex-wrap gap-x-4">
        <span>
          Turnover <b className="ml-1">{formatAmount(summary.turnover)}</b>
        </span>
        <span>
          Agent profit <b className="ml-1">{formatAmount(summary.agentProfits)}</b>
        </span>
        <span>
          Platform debt <b className="ml-1">{formatAmount(summary.platformDebt)}</b>
        </span>
      </span>
    )}
  </div>
);

export default WeekClosedBanner;
