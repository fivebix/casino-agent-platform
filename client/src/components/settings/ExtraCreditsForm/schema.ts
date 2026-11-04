import * as yup from 'yup';
import { hasAtMostTwoDecimals } from '@/lib/utils';

const row = yup.object({
  /** `'all'` or a player's user id. */
  target: yup.string().required(),
  label: yup.string().required(),
  selected: yup.boolean().required(),
  amount: yup
    .number()
    .transform((v) => (Number.isNaN(v) ? undefined : v))
    .typeError('Enter a number')
    .min(0, 'Must be 0 or more')
    .test('decimals', 'At most 2 decimals', (v) => v === undefined || hasAtMostTwoDecimals(v))
    .when('selected', {
      is: true,
      then: (s) => s.required('Enter an amount').moreThan(0, 'Must be more than 0'),
      otherwise: (s) => s.optional(),
    }),
});

export const extraCreditsSchema = yup.object({
  rows: yup
    .array(row)
    .required()
    .test('some', 'Tick at least one user', (rows) => !!rows?.some((r) => r.selected)),
});
