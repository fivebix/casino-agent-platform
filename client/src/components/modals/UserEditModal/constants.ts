import type { SelectOption } from '@/components/ui/select';
import type { TabItem } from '@/components/ui/tabs';
import type { UserEditTab } from './type';

export const USER_EDIT_TABS: TabItem<UserEditTab>[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'settings', label: 'Settings' },
  { value: 'limits', label: 'Limits' },
  { value: 'messages', label: 'Messages' },
  { value: 'modules', label: 'Modules' },
  { value: 'notify', label: 'Notify' },
  // Loss discount commented out: the tab now only holds the shares.
  // { value: 'shares', label: 'Shares & Discounts' },
  { value: 'shares', label: 'Shares' },
];

/** One `<form id>` per tab so the shell's Save button submits the active tab. */
export const TAB_FORM_ID: Record<UserEditTab, string> = {
  profile: 'user-edit-profile',
  settings: 'user-edit-settings',
  limits: 'user-edit-limits',
  messages: 'user-edit-messages',
  modules: 'user-edit-modules',
  notify: 'user-edit-notify',
  shares: 'user-edit-shares',
};

/** Shared RTK `fixedCacheKey`s: the tab fires the mutation, the shell reads its `isLoading`. */
export const SAVE_CACHE_KEY: Record<UserEditTab, string> = {
  profile: 'user-edit:profile',
  settings: 'user-edit:settings',
  limits: 'user-edit:limits',
  messages: 'user-edit:messages',
  modules: 'user-edit:modules',
  notify: 'user-edit:notify',
  shares: 'user-edit:shares',
};

const range = (from: number, to: number): SelectOption[] =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const v = String(from + i);
    return { value: v, label: v };
  });

// ---------- Settings tab (design 11) ----------

export type SettingsSelectField = 'odds' | 'live' | 'parlay' | 'maxCountBetsOnGame';
export type SettingsNumberField =
  | 'percent1x2Prematch'
  | 'percent1x2Live'
  | 'percentPropositions'
  | 'limitProposition'
  | 'maxBetLimit'
  | 'limitUserPerGame'
  | 'limitUserPerGameLive'
  | 'limitUserCombo';
export type SettingsCheckField = 'allowRejectedForMaxCount' | 'ignoreLeagueMaxBetCount';

type SettingsRow =
  | {
      kind: 'select';
      name: SettingsSelectField;
      label: string;
      tip: string;
      options: SelectOption[];
    }
  | { kind: 'number'; name: SettingsNumberField; label: string; tip: string }
  | { kind: 'check'; name: SettingsCheckField; label: string; tip: string };

/** Order, labels and defaults follow design 11. The design only shows the selected values. */
export const SETTINGS_ROWS: SettingsRow[] = [
  {
    kind: 'select',
    name: 'odds',
    label: 'Odds',
    tip: 'Prematch odds margin level applied to this user.',
    options: range(1, 30),
  },
  {
    kind: 'select',
    name: 'live',
    label: 'Live',
    tip: 'Live odds margin level applied to this user.',
    options: range(1, 30),
  },
  {
    kind: 'select',
    name: 'parlay',
    label: 'Parlay',
    tip: 'Maximum number of selections allowed in one parlay.',
    options: range(1, 50),
  },
  {
    kind: 'number',
    name: 'percent1x2Prematch',
    label: 'Percent 1×2 prematch',
    tip: 'Extra margin percent on prematch 1×2 markets.',
  },
  {
    kind: 'number',
    name: 'percent1x2Live',
    label: 'Percent 1×2 LIVE',
    tip: 'Extra margin percent on live 1×2 markets.',
  },
  {
    kind: 'number',
    name: 'percentPropositions',
    label: 'Percent Propositions',
    tip: 'Extra margin percent on proposition markets.',
  },
  {
    kind: 'number',
    name: 'limitProposition',
    label: 'Limit Proposition',
    tip: 'Maximum stake on a proposition market. 0 = no limit.',
  },
  {
    kind: 'number',
    name: 'maxBetLimit',
    label: 'Max bet limit',
    tip: 'Maximum stake of a single bet. 0 = no limit.',
  },
  {
    kind: 'number',
    name: 'limitUserPerGame',
    label: 'Limit user per game',
    tip: 'Maximum total stake per prematch game. 0 = no limit.',
  },
  {
    kind: 'number',
    name: 'limitUserPerGameLive',
    label: 'Limit user per game live',
    tip: 'Maximum total stake per live game. 0 = no limit.',
  },
  {
    kind: 'number',
    name: 'limitUserCombo',
    label: 'Limit user combo',
    tip: 'Maximum stake of a combo (parlay) bet. 0 = no limit.',
  },
  {
    kind: 'select',
    name: 'maxCountBetsOnGame',
    label: 'Max count bets on 1 game',
    tip: 'How many bets the user may place on the same game.',
    options: range(1, 20),
  },
  {
    kind: 'check',
    name: 'allowRejectedForMaxCount',
    label: 'Allow rejected for max count',
    tip: 'Rejected bets do not count towards the max bets per game.',
  },
  {
    kind: 'check',
    name: 'ignoreLeagueMaxBetCount',
    label: 'Ignore League Max Bet Count',
    tip: 'Ignore the league-level max bet count for this user.',
  },
];

export const SETTINGS_DEFAULTS = {
  odds: '14',
  live: '21',
  parlay: '36',
  percent1x2Prematch: 0,
  percent1x2Live: 0,
  percentPropositions: 0,
  limitProposition: 0,
  maxBetLimit: 0,
  limitUserPerGame: 0,
  limitUserPerGameLive: 0,
  limitUserCombo: 0,
  maxCountBetsOnGame: '10',
  allowRejectedForMaxCount: true,
  ignoreLeagueMaxBetCount: false,
};

// ---------- Limits tab (designs 12, 36) ----------

export type LimitSport = { key: string; label: string; leagues: string[] };

/** "All Sports" first (bold, no leagues); Chance and Lotto have no leagues either. */
export const LIMIT_SPORTS: LimitSport[] = [
  { key: 'allSports', label: 'All Sports', leagues: [] },
  {
    key: 'soccer',
    label: 'Soccer',
    leagues: [
      'England Championship',
      'England FA Trophy',
      'England League Cup',
      'England League One',
      'England League Two',
      'England National League',
      'England Premier League',
      'England Women',
      'Switzerland Challenge League',
      'Switzerland Super League',
      'Spain La Liga',
      'Italy Serie A',
      'Germany Bundesliga',
      'France Ligue 1',
      'Israel Premier League',
      'UEFA Champions League',
      'UEFA Europa League',
    ],
  },
  {
    key: 'basketball',
    label: 'Basketball',
    leagues: ['NBA', 'Euroleague', 'Israel Super League', 'Spain ACB', 'NCAA'],
  },
  { key: 'tennis', label: 'Tennis', leagues: ['ATP', 'WTA', 'ITF Men', 'ITF Women', 'Challenger'] },
  { key: 'baseball', label: 'Baseball', leagues: ['MLB', 'NPB', 'KBO'] },
  { key: 'iceHockey', label: 'Ice Hockey', leagues: ['NHL', 'KHL', 'SHL', 'Liiga'] },
  { key: 'boxing', label: 'Boxing', leagues: ['World Title Fights', 'International Fights'] },
  { key: 'chance', label: 'Chance', leagues: [] },
  { key: 'lotto', label: 'Lotto', leagues: [] },
  { key: 'americanFootball', label: 'American Football', leagues: ['NFL', 'NCAAF', 'CFL'] },
  { key: 'australianFootball', label: 'Australian Football', leagues: ['AFL'] },
  {
    key: 'volleyball',
    label: 'Volleyball',
    leagues: ['Italy SuperLega', 'Poland PlusLiga', 'CEV Champions League'],
  },
  { key: 'tableTennis', label: 'Table Tennis', leagues: ['TT Cup', 'Setka Cup', 'WTT Contender'] },
];

export const LEAGUE_MARKETS = [
  { key: 'ftMl', label: 'FT ML' },
  { key: 'ftAh', label: 'FT AH' },
  { key: 'ftOu', label: 'FT OU' },
  { key: 'htMl', label: 'HT ML' },
  { key: 'htAh', label: 'HT AH' },
  { key: 'htOu', label: 'HT OU' },
] as const;

export type LeagueMarket = (typeof LEAGUE_MARKETS)[number]['key'];

/** Form-safe id for a league name (react-hook-form paths cannot contain dots). */
export const leagueId = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ---------- Modules tab (design 14) ----------

export const MODULE_KEYS = [
  'sport_live',
  'casino_slots',
  'casino_live',
  'casino_virtual',
  'pais_chance',
] as const;

// ---------- Notify tab (design 15) ----------

export type NotifyRow = {
  key: string;
  label: string;
  /** Has a threshold box; `percent` shows a `%` after it. */
  threshold?: 'amount' | 'percent';
};

export const NOTIFY_ROWS: NotifyRow[] = [
  { key: 'betStake', label: 'Send when user made bet stake more then', threshold: 'amount' },
  { key: 'betWin', label: 'Send when user have bet win more then', threshold: 'amount' },
  { key: 'deletedBet', label: 'Send when user have deleted bet' },
  { key: 'problemBet', label: 'Send when user have problem bet' },
  { key: 'casinoStake', label: 'Send when user made casino stake more then', threshold: 'amount' },
  { key: 'casinoWin', label: 'Send when user have casino win more then', threshold: 'amount' },
  { key: 'chanceStake', label: 'Send when user made chance stake more then', threshold: 'amount' },
  { key: 'chanceWin', label: 'Send when user have chance win more then', threshold: 'amount' },
  { key: 'loggedIn', label: 'Send when user logged in to site' },
  { key: 'lowCredit', label: 'Send when user credit left is too low', threshold: 'percent' },
];

// ---------- Shares & Discounts tab (design 25) ----------

export const BONUS_SPLIT_OPTIONS: SelectOption[] = [
  { value: 'agent100-company0', label: 'Agent 100% · Company 0%' },
  { value: 'agent70-company30', label: 'Agent 70% · Company 30%' },
  { value: 'agent50-company50', label: 'Agent 50% · Company 50%' },
  { value: 'agent30-company70', label: 'Agent 30% · Company 70%' },
  { value: 'agent0-company100', label: 'Agent 0% · Company 100%' },
];

export const MIN_SPORTS_BETS_PRESETS = [10, 15, 20];
