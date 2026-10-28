import { isInSubtree } from './agent-path';
import { fromCents, toCents } from './credit-rules';

export type ActivityKind = 'bet' | 'win' | 'refund';

export interface ActivityLike {
  type: string;
  amount: number | null;
}

export interface PlayerTotals {
  turnover: number;
  calc: number;
}

/**
 * Only bet, win and refund count. Adjustments (including the agent platform's
 * own credits and the weekly reset coming back as events) are ignored, or the
 * same money would be counted twice.
 */
export function playerTotals(events: ActivityLike[]): PlayerTotals {
  let turnover = 0;
  let calc = 0;
  for (const e of events) {
    const cents = toCents(e.amount ?? 0);
    if (e.type === 'bet') {
      turnover += cents;
      calc -= cents;
    } else if (e.type === 'win') {
      calc += cents;
    } else if (e.type === 'refund') {
      turnover -= cents;
      calc += cents;
    }
  }
  return { turnover: fromCents(turnover), calc: fromCents(calc) };
}

export interface PlayerRow {
  agentPath: string;
  totals: PlayerTotals;
}

export interface CorrectionRow {
  agentPath: string;
  amount: number;
}

/**
 * An agent's numbers are always the sum of everything below it: never stored,
 * so "a -5 next to an agent opens to players and bets that add up to -5".
 */
export function aggregate(
  path: string,
  players: PlayerRow[],
  corrections: CorrectionRow[],
): { turnover: number; calc: number; corrections: number; calcWithCorrections: number } {
  let turnover = 0;
  let calc = 0;
  let corr = 0;
  for (const p of players) {
    if (!isInSubtree(p.agentPath, path)) continue;
    turnover += toCents(p.totals.turnover);
    calc += toCents(p.totals.calc);
  }
  for (const c of corrections) {
    if (isInSubtree(c.agentPath, path)) corr += toCents(c.amount);
  }
  return {
    turnover: fromCents(turnover),
    calc: fromCents(calc),
    corrections: fromCents(corr),
    calcWithCorrections: fromCents(calc + corr),
  };
}
