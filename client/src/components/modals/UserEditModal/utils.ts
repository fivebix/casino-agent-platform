/** Helpers that read the free-form JSON sections (`settings`, `limits`, `notify`) defensively. */

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** The value when it is a plain object, else `{}`. */
export const asRecord = (v: unknown): Record<string, unknown> => (isRecord(v) ? v : {});

export const readNumber = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
};

export const readBool = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : fallback;

export const readString = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v !== '' ? v : typeof v === 'number' ? String(v) : fallback;

/** NaN (an emptied number box) → 0. */
export const cleanNumber = (v: unknown): number => readNumber(v, 0);
