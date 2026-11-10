import * as yup from 'yup';
import { hasAtMostTwoDecimals } from '@/lib/utils';
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';
import { NOTIFY_ROWS } from './constants';

/** `valueAsNumber` turns an empty box into NaN; treat that as "missing". */
const nanToUndefined = (value: unknown) =>
  typeof value === 'number' && Number.isNaN(value) ? undefined : value;

export const amountField = () =>
  yup
    .number()
    .transform(nanToUndefined)
    .typeError('Enter a number')
    .min(0, 'Must be 0 or more')
    .required('Required');

const percentField = () =>
  amountField()
    .max(100, 'At most 100')
    .test('decimals', 'At most 2 decimals', (v) => v === undefined || hasAtMostTwoDecimals(v));

const countField = () => amountField().integer('Whole number');

export const profileSchema = yup.object({
  name: yup.string().trim().required('Name is required').max(120, 'At most 120 characters'),
  password: yup
    .string()
    .default('')
    .test(
      'min',
      `At least ${PASSWORD_MIN_LENGTH} characters`,
      (v) => !v || v.length >= PASSWORD_MIN_LENGTH,
    )
    .max(128, 'At most 128 characters'),
  confirmPassword: yup
    .string()
    .default('')
    .test('match', 'Passwords do not match', function match(v) {
      return (v ?? '') === (this.parent.password ?? '');
    }),
  isActive: yup.boolean().required(),
  autoWeeklyCredit: amountField(),
  autoWeeklyEnabled: yup.boolean().required(),
  /** Agents only ('' for a player). */
  country: yup.string().default(''),
  timezone: yup.string().default(''),
});

export const settingsSchema = yup.object({
  odds: yup.string().required(),
  live: yup.string().required(),
  parlay: yup.string().required(),
  percent1x2Prematch: percentField(),
  percent1x2Live: percentField(),
  percentPropositions: percentField(),
  limitProposition: amountField(),
  maxBetLimit: amountField(),
  limitUserPerGame: amountField(),
  limitUserPerGameLive: amountField(),
  limitUserCombo: amountField(),
  maxCountBetsOnGame: yup.string().required(),
  allowRejectedForMaxCount: yup.boolean().required(),
  ignoreLeagueMaxBetCount: yup.boolean().required(),
});

export const messageSchema = yup.object({
  title: yup.string().trim().required('Title is required').max(200, 'At most 200 characters'),
  body: yup.string().trim().required('Message is required').max(5000, 'At most 5000 characters'),
});

export const notifySchema = yup.object({
  notify: yup.object(
    Object.fromEntries(
      NOTIFY_ROWS.map((row) => [
        row.key,
        yup.object({
          enabled: yup.boolean().required(),
          value: row.threshold === 'percent' ? percentField() : amountField(),
        }),
      ]),
    ),
  ),
});

export const sharesSchema = yup.object({
  sportShare: percentField(),
  casinoShare: percentField(),
  chanceShare: percentField(),
  bonusSplit: yup.string().required(),
  discountEnabled: yup.boolean().required(),
  sportsDiscount: percentField(),
  casinoDiscount: percentField(),
  chanceDiscount: percentField(),
  minSportsBets: countField(),
  minCasinoBets: countField(),
});
