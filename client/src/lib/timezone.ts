import type { SelectOption } from '@/components/ui/select';

/**
 * The panel shows every time in the signed-in agent's own time zone (`AgentMe.timezone`), not the browser's: the
 * week closes at Tuesday 11:00 there. Set once the agent is known (AuthGuardLayout); unset = the browser's zone.
 */
let displayZone: string | undefined;

export const setDisplayTimeZone = (zone?: string | null) => {
  displayZone = zone && isValidTimeZone(zone) ? zone : undefined;
};

export const getDisplayTimeZone = (): string => displayZone ?? browserTimeZone();

export const browserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const formatters = new Map<string, Intl.DateTimeFormat>();
const formatterOf = (zone: string) => {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(zone, f);
  }
  return f;
};

export const isValidTimeZone = (zone: string): boolean => {
  try {
    formatterOf(zone);
    return true;
  } catch {
    return false;
  }
};

/**
 * `date` as a Date whose *local* fields show the wall clock in `zone` (for date-fns `format` and the week maths).
 * Not a real instant: only read its fields.
 */
export const toZonedWall = (date: Date, zone: string = getDisplayTimeZone()): Date => {
  const parts: Record<string, number> = {};
  for (const p of formatterOf(zone).formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second,
    date.getMilliseconds(),
  );
};

/** The real instant at which the wall clock in `zone` shows the local fields of `wall`. */
export const fromZonedWall = (wall: Date, zone: string = getDisplayTimeZone()): Date => {
  const target = Date.UTC(
    wall.getFullYear(),
    wall.getMonth(),
    wall.getDate(),
    wall.getHours(),
    wall.getMinutes(),
    wall.getSeconds(),
    wall.getMilliseconds(),
  );
  const offsetAt = (t: number) => {
    const w = toZonedWall(new Date(t), zone);
    return (
      Date.UTC(
        w.getFullYear(),
        w.getMonth(),
        w.getDate(),
        w.getHours(),
        w.getMinutes(),
        w.getSeconds(),
        w.getMilliseconds(),
      ) - t
    );
  };
  let guess = target - offsetAt(target);
  guess = target - offsetAt(guess);
  return new Date(guess);
};

/** `UTC+05:30` for `zone` right now. */
export const utcOffsetLabel = (zone: string, at: Date = new Date()): string => {
  const wall = toZonedWall(at, zone);
  const minutes = Math.round(
    (Date.UTC(
      wall.getFullYear(),
      wall.getMonth(),
      wall.getDate(),
      wall.getHours(),
      wall.getMinutes(),
    ) -
      Date.UTC(
        at.getUTCFullYear(),
        at.getUTCMonth(),
        at.getUTCDate(),
        at.getUTCHours(),
        at.getUTCMinutes(),
      )) /
      60_000,
  );
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
};

let zoneOptions: SelectOption[] | null = null;

/** Every IANA zone the browser knows, as `(UTC+05:30) Asia/Kolkata`, sorted by offset then name. */
export const timeZoneOptions = (include?: string | null): SelectOption[] => {
  if (!zoneOptions) {
    let zones: string[] = [];
    try {
      zones =
        (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
          'timeZone',
        ) ?? [];
    } catch {
      zones = [];
    }
    const all = [...new Set(['UTC', browserTimeZone(), ...zones])].filter(isValidTimeZone);
    const now = new Date();
    const withOffset = all.map((z) => {
      const label = utcOffsetLabel(z, now);
      const sign = label[3] === '-' ? -1 : 1;
      const [h, m] = label.slice(4).split(':').map(Number);
      return { z, label, minutes: sign * (h * 60 + m) };
    });
    withOffset.sort((a, b) => a.minutes - b.minutes || a.z.localeCompare(b.z));
    zoneOptions = withOffset.map((x) => ({ value: x.z, label: `(${x.label}) ${x.z}` }));
  }
  if (include && !zoneOptions.some((o) => o.value === include) && isValidTimeZone(include)) {
    return [{ value: include, label: `(${utcOffsetLabel(include)}) ${include}` }, ...zoneOptions];
  }
  return zoneOptions;
};

/** ISO 3166-1 alpha-2 codes (assigned). */
const COUNTRY_CODES =
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  );

let countryOptions: SelectOption[] | null = null;

export const countryName = (code?: string | null): string => {
  if (!code) return '—';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** Every country by English name. */
export const getCountryOptions = (): SelectOption[] => {
  if (!countryOptions) {
    countryOptions = COUNTRY_CODES.map((code) => ({ value: code, label: countryName(code) })).sort(
      (a, b) => a.label.localeCompare(b.label),
    );
  }
  return countryOptions;
};
