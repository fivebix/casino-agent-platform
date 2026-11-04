/**
 * Modal ids + the props each one takes. Kept apart from `index.tsx` so slices/hooks can import the ids
 * without pulling in the modal components.
 *
 * To add a modal: add its id to MODAL_TYPES, its props to ModalPropsMap, and register the component in
 * `index.tsx` (MODAL_COMPONENTS).
 */
import type { ChanceBet, SportBet } from '@/types/agent';
import type { UserKindPath, WeekStart } from '@/types/agent';

export const MODAL_TYPES = {
  BALANCE: 'BALANCE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  BET_DETAILS: 'BET_DETAILS',
  CREDIT_AMOUNT: 'CREDIT_AMOUNT',
  BACKUP_CREDIT: 'BACKUP_CREDIT',
  CALCULATION: 'CALCULATION',
  USER_EDIT: 'USER_EDIT',
} as const;

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES];

export type ModalPropsMap = {
  [MODAL_TYPES.BALANCE]: undefined;
  [MODAL_TYPES.FORGOT_PASSWORD]: { email?: string } | undefined;
  [MODAL_TYPES.BET_DETAILS]: { bet: SportBet | ChanceBet };
  [MODAL_TYPES.CREDIT_AMOUNT]: { kind: UserKindPath; id: string; username: string };
  [MODAL_TYPES.BACKUP_CREDIT]: { id: string; username: string; amount: number };
  [MODAL_TYPES.USER_EDIT]: { kind: UserKindPath; id: string; username: string };
  [MODAL_TYPES.CALCULATION]: {
    kind: UserKindPath;
    id: string;
    username: string;
    weekStart?: WeekStart;
    isCurrentWeek: boolean;
  };
};
