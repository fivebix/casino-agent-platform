/**
 * Hand-written from sweepstakes-backend/docs/agent-network-api.md (v1).
 * Money = number with 2 decimals. Percentages = 0–100. Dates = ISO strings unless noted.
 */

export type Product = 'sport' | 'casino' | 'chance' | 'overall';
export type NodeRole = 'admin_agent' | 'agent' | 'sub_agent' | 'player';
export type UserKind = 'agent' | 'player';
/** Path segment used by the `/agent/:kind/:id/...` routes. */
export type UserKindPath = 'agents' | 'players';
export type OddsFormat = 'decimal' | 'american' | 'fractional';
/** `YYYY-MM-DD` of the Tuesday a week starts on. */
export type WeekStart = string;

// ---------- 1. Auth ----------

export type AgentMe = {
  id: string;
  publicId: number;
  operatorId: string;
  username: string;
  name: string;
  email: string;
  role: NodeRole;
  depth: number;
  parentName: string | null;
  creditLimit: number;
  creditBalance: number;
  backupCredit: number;
  backupCreditUsed: number;
  language: string;
  oddsFormat: OddsFormat;
  mustChangePassword: boolean;
  sportShare: number;
  casinoShare: number;
  chanceShare: number;
  /** Highest loss discount this agent may give. */
  maxDiscount: number;
  lastLoginAt: string | null;
};

export type LoginRequest = { operatorId: string; username: string; password: string };
export type SetPasswordRequest = { currentPassword?: string; newPassword: string };
export type ForgotPasswordRequest = { operatorId: string; email: string };
export type ResetPasswordRequest = {
  operatorId: string;
  email: string;
  otp: string;
  newPassword: string;
};
export type UpdatePreferencesRequest = { language?: string; oddsFormat?: OddsFormat };

// ---------- 2. Users list ----------

export type Week = {
  start: string;
  end: string;
  weekStart: WeekStart;
  isCurrent: boolean;
  previous: WeekStart;
  next: WeekStart | null;
};

export type UserFigures = {
  creditBalance: number;
  calc: number;
  backupCredit: number;
  riskMoney: number;
  openBets: number;
  closedBets: number;
  turnover: number;
  total: number;
  bonus: number;
  nette: number;
  sharePct: number;
  companyShare: number;
  agentShare: number;
};

export type UserRow = UserFigures & {
  id: string;
  kind: UserKind;
  publicId: number;
  username: string;
  name: string;
  role: NodeRole;
  depth: number;
  parentId: string | null;
  isActive: boolean;
  hasChildren: boolean;
};

/** The backend sums every numeric field except `sharePct`. */
export type Totals = Omit<UserFigures, 'sharePct'>;

export type AgentSummary = {
  totalBalance: number;
  balanceSpend: number;
  currentBalance: number;
  sportsCommission: number;
  casinoCommission: number;
  chanceCommission: number;
  sportsDiscount: number;
  casinoDiscount: number;
  chanceDiscount: number;
  backupCredit: boolean;
  backupCreditAmount: number;
  usedBackupCredit: number;
  turnover: number;
  totalDiscount: number;
  agentProfits: number;
  platformProfits: number;
  platformDebt: number;
  /** The caller's credit left; only on the caller's own list (not on a sub-agent's children). */
  creditLeft?: number;
};

export type UsersList = {
  week: Week;
  rows: UserRow[];
  totals: Totals;
  summary: AgentSummary;
};

export type UsersListQuery = {
  weekStart?: WeekStart;
  product?: Product;
  showInactive?: boolean;
  search?: string;
};

export type BetStatus = 'won' | 'lost' | 'open' | 'refunded';

export type BetRow = {
  id: string;
  roundId: string;
  placedAt: string;
  /** Same as `placedAt`. */
  playedAt?: string;
  game: string;
  provider: string;
  stake: number;
  win: number;
  net: number;
  status: BetStatus;
};

export type PlayerBets = {
  settled: number;
  open: number;
  calc: number;
  items: BetRow[];
};

// ---------- 3. Create ----------

export type CreateAgentRequest = {
  username: string;
  name: string;
  email: string;
  password: string;
  sportShare: number;
  casinoShare: number;
  chanceShare: number;
  autoWeeklyCredit: number;
  credit?: number;
  language?: string;
  /** Admin agent only: create the sub-agent under this agent. */
  parentId?: string;
};

export type CreatePlayerRequest = {
  username: string;
  name: string;
  email: string;
  password: string;
  autoWeeklyCredit: number;
  credit?: number;
  language?: string;
  /** Admin agent only: create the player under this agent or sub-agent. */
  agentId?: string;
};

export type CreatedUser = { id: string; publicId: number; username: string; name: string };

// ---------- 4. User edit ----------

export type UserDetail = {
  id: string;
  kind: UserKind;
  publicId: number;
  username: string;
  name: string;
  /** A player's email comes from its casino user and may be missing. */
  email: string | null;
  role: NodeRole;
  isActive: boolean;
  createdAt: string;
  leaderName: string | null;
  creditLimit: number;
  autoWeeklyCredit: number;
  autoWeeklyEnabled: boolean;
  multiplier: number;
  sportShare: number;
  casinoShare: number;
  chanceShare: number;
  /** e.g. `agent50-company50`. A player shows its owner's (null without one). */
  bonusSplit: string | null;
  discountEnabled: boolean;
  sportsDiscount: number;
  casinoDiscount: number;
  chanceDiscount: number;
  minSportsBets: number;
  minCasinoBets: number;
  settings: Record<string, unknown>;
  limits: Record<string, unknown>;
  modules: Record<string, boolean>;
  notify: Record<string, unknown>;
};

/** Identifies a node for the `/agent/:kind/:id/...` routes. */
export type UserRef = { kind: UserKindPath; id: string };

export type UpdateProfileRequest = {
  name?: string;
  password?: string;
  isActive?: boolean;
  autoWeeklyCredit?: number;
  autoWeeklyEnabled?: boolean;
};

export type UpdateSharesRequest = {
  sportShare?: number;
  casinoShare?: number;
  chanceShare?: number;
  /** Agents only, e.g. `agent50-company50` (max 40 chars). */
  bonusSplit?: string;
  discountEnabled?: boolean;
  sportsDiscount?: number;
  casinoDiscount?: number;
  chanceDiscount?: number;
  minSportsBets?: number;
  minCasinoBets?: number;
};

export type AgentMessage = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdByName: string;
};

// ---------- 5. Credit, balance, calculation ----------

export type Balance = { balance: number; creditLeft: number };

export type CreditInfo = {
  /** The caller's credit left. */
  lessCredit: number;
  weeklyCredit: number;
  extraCredit: number;
  creditAmount: number;
  groupCreditUsed?: number;
  inactiveUsersCredit?: number;
  autoWeeklyCredit: number;
};

/** Exactly one of the three. */
export type UpdateCreditRequest =
  | { creditAmount: number; addExtra?: never; withdraw?: never }
  | { addExtra: number; creditAmount?: never; withdraw?: never }
  | { withdraw: number; creditAmount?: never; addExtra?: never };

/** `target` = `'all'` or a player id. */
export type ExtraCreditsRequest = { target: string; amount: number };

export type Correction = {
  id: string;
  amount: number;
  comment: string | null;
  createdAt: string;
  createdByName: string;
};

export type Corrections = { currentSum: number; items: Correction[] };

// ---------- 6. Bets and casino ----------

/**
 * `agent-report.service.ts` `casinoRounds()`: one row per (round, player). `id` = `${playerId}:${roundId}`,
 * `placedAt` mirrors `playedAt`, `game` / `provider` are `'—'` when unknown, `status` is only `won` | `lost`.
 * The backend does not return the player's agent.
 */
export type CasinoRound = {
  id: string;
  roundId: string;
  playedAt: string;
  placedAt: string;
  username: string;
  playerId: string;
  /** The player's own agent. */
  agentUsername: string | null;
  game: string;
  provider: string;
  stake: number;
  win: number;
  net: number;
  status: Extract<BetStatus, 'won' | 'lost'>;
};

export type CasinoRoundsQuery = {
  weekStart?: WeekStart;
  providerId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CasinoProvider = { id: string; name: string };

/** `GET /agent/bets` (`AgentBetsQueryDto`). `limit` ≤ 200. The backend ignores every filter for now. */
export type BetsQuery = {
  product: 'sport' | 'chance';
  weekStart?: WeekStart;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  live?: boolean;
};

export type SportBetsQuery = Omit<BetsQuery, 'product'>;
export type ChanceBetsQuery = Omit<BetsQuery, 'product' | 'live'>;

/*
 * Sportsbook and chance are not integrated yet: `GET /agent/bets` always returns an empty page and the
 * row shape is not in the contract. The shapes below are what the Bet List / Bets online / Chance / Bet
 * details designs (02, 03, 05, 17) need; the backend should return these when a sportsbook lands.
 * Odds are decimal; the panel formats them with the agent's odds format.
 */

/** `open` = Pending, `lost` = Losed, `refunded` = Returned, `rejected` = Reject. */
export type SportBetStatus = 'open' | 'won' | 'lost' | 'refunded' | 'rejected' | 'deleted';

/** One selection of a bet (a single has exactly one). */
export type SportBetLeg = {
  id: string;
  sport: string;
  /** e.g. `Spain La Liga`. */
  league: string;
  /** e.g. `Bilbao - Valencia`. */
  game: string;
  /** Market + pick, e.g. `Full Time Bilbao`, `Live 1st Half 23' [0:0] O 2.5`. */
  event: string;
  /** Just the pick, e.g. `Bilbao`, `O 2.5` (parlay summary line). */
  pick: string;
  isLive: boolean;
  odds: number;
  /** Final score, e.g. `2 : 0`. */
  score: string | null;
  gameDate: string | null;
  status: SportBetStatus;
};

export type SportBet = {
  id: string;
  playerId: string;
  playerPublicId: number;
  username: string;
  name: string;
  placedAt: string;
  wagerType: 'single' | 'parlay';
  isLive: boolean;
  legs: SportBetLeg[];
  /** Total odds at placement, then 5 / 10 minutes later and now (null when not tracked). */
  odds: number;
  odds5m: number | null;
  odds10m: number | null;
  oddsNow: number | null;
  stake: number;
  /** Potential payout (stake × odds). */
  toWin: number;
  /** Settled P/L (0 while open). */
  net: number;
  status: SportBetStatus;
  /** The agent takes 100% of the bet (Bets online ✓ / ✗ column, Bet details "100%"). */
  fullShare: boolean | null;
  /** Agent share % of the bet (the number column on Bets online). */
  sharePct: number | null;
  ip: string | null;
};

export type ChanceBet = {
  id: string;
  playerId: string;
  username: string;
  placedAt: string;
  ticketId: string;
  lotteryNumber: string;
  gameDate: string | null;
  /** Lottery / game type. */
  type: string;
  stake: number;
  win: number;
  status: SportBetStatus;
  /** Ticket form (picked numbers / form name). */
  form: string | null;
  ip: string | null;
};

// ---------- 7. Settings ----------

/** `GET` returns `{}` until the agent saves once, so every field may be missing. */
export type SubscribeSettings = {
  telegramChatId: string | null;
  notifyStakeAbove: number | null;
  notifyWinAbove: number | null;
  notifyDeletedBet: boolean;
  notifyProblemBet: boolean;
  notifyCasinoStakeAbove: number | null;
  notifyCasinoWinAbove: number | null;
  notifyChanceStakeAbove: number | null;
  notifyChanceWinAbove: number | null;
  notifyExtraMoney: number | null;
};

// ---------- Operator (public resolve) ----------

/** Subset of the backend's OperatorDto the panel uses. */
export type Operator = {
  id: string;
  name: string;
  subdomain: string;
  config?: Record<string, unknown> & { logoUrl?: string; faviconUrl?: string };
};
