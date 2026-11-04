import * as yup from 'yup';
import type { SubscribeSettings } from '@/types/agent';

type ThresholdKey = Exclude<
  keyof SubscribeSettings,
  'telegramChatId' | 'notifyDeletedBet' | 'notifyProblemBet'
>;
type FlagKey = 'notifyDeletedBet' | 'notifyProblemBet';

export type SubscribeRow =
  | { key: ThresholdKey; label: string; threshold: true }
  | { key: FlagKey; label: string; threshold: false };

/** Design 07, top to bottom. A threshold row sends `null` when unchecked. */
export const SUBSCRIBE_ROWS: SubscribeRow[] = [
  { key: 'notifyStakeAbove', label: 'Notify when user made bet stake more then', threshold: true },
  { key: 'notifyWinAbove', label: 'Notify when user have bet win more then', threshold: true },
  { key: 'notifyDeletedBet', label: 'Notify when user have deleted bet', threshold: false },
  { key: 'notifyProblemBet', label: 'Notify when user have problem bet', threshold: false },
  {
    key: 'notifyCasinoStakeAbove',
    label: 'Notify when user made casino stake more then',
    threshold: true,
  },
  {
    key: 'notifyCasinoWinAbove',
    label: 'Notify when user have casino win more then',
    threshold: true,
  },
  {
    key: 'notifyChanceStakeAbove',
    label: 'Notify when user made chance stake more then',
    threshold: true,
  },
  {
    key: 'notifyChanceWinAbove',
    label: 'Notify when user have chance win more then',
    threshold: true,
  },
  { key: 'notifyExtraMoney', label: 'Notify when user gets extra money', threshold: true },
];

const row = yup.object({
  enabled: yup.boolean().required(),
  value: yup
    .number()
    .transform((v) => (Number.isNaN(v) ? undefined : v))
    .typeError('Enter a number')
    .min(0, 'Must be 0 or more')
    .required('Required'),
});

export const subscribeSchema = yup.object({
  rows: yup.object(Object.fromEntries(SUBSCRIBE_ROWS.map((r) => [r.key, row]))),
});
