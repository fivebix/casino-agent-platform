import * as yup from 'yup';
import { hasAtMostTwoDecimals } from '@/lib/utils';
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';

const nanToUndefined = (value: unknown) =>
  typeof value === 'number' && Number.isNaN(value) ? undefined : value;

const money = () =>
  yup
    .number()
    .transform(nanToUndefined)
    .typeError('Enter a number')
    .min(0, 'Must be 0 or more')
    .test('decimals', 'At most 2 decimals', (v) => v === undefined || hasAtMostTwoDecimals(v));

const share = () =>
  money()
    .max(100, 'At most 100')
    .when('type', {
      is: 'agent',
      then: (s) => s.required('Required'),
      otherwise: (s) => s.optional(),
    });

/** Mirrors CreateAgentPlayerDto / CreateSubAgentDto in sweepstakes-backend. */
export const createUserSchema = yup.object({
  type: yup.mixed<'player' | 'agent'>().oneOf(['player', 'agent']).required(),
  username: yup
    .string()
    .trim()
    .required('Username is required')
    .matches(/^[A-Za-z0-9_.-]{3,60}$/, '3–60 characters: letters, digits, _ . -'),
  name: yup.string().trim().required('Name is required').max(120, 'At most 120 characters'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .email('Enter a valid email')
    .max(255, 'At most 255 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
    .max(128, 'At most 128 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm the password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  autoWeeklyCredit: money().required('Auto weekly credit is required'),
  credit: money().optional(),
  language: yup.string().required(),
  /** Admin agent only: the agent to create under ('' = the caller). */
  parentId: yup.string().optional(),
  /** Agents only: ISO country and IANA zone (the week closes at Tuesday 11:00 there). */
  country: yup.string().when('type', {
    is: 'agent',
    then: (s) => s.required('Choose a country'),
    otherwise: (s) => s.optional(),
  }),
  timezone: yup.string().when('type', {
    is: 'agent',
    then: (s) => s.required('Choose a time zone'),
    otherwise: (s) => s.optional(),
  }),
  sportShare: share(),
  casinoShare: share(),
  chanceShare: share(),
});
