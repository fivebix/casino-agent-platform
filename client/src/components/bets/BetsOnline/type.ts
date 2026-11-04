import type { SportBet, SportBetLeg } from '@/types/agent';

export type LiveFilter = 'all' | 'prematch' | 'live';

/** A bet, or one leg of a parlay rendered as its child row. */
export type BetsOnlineRow =
  { kind: 'bet'; bet: SportBet } | { kind: 'leg'; bet: SportBet; leg: SportBetLeg };
