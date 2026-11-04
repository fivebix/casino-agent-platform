import type { InferType } from 'yup';
import type { ModalBaseProps } from '@/types/common';
import type { UserDetail, UserKindPath } from '@/types/agent';
import type { messageSchema, profileSchema, settingsSchema, sharesSchema } from './schema';

export type UserEditTab =
  'profile' | 'settings' | 'limits' | 'messages' | 'modules' | 'notify' | 'shares';

export type UserEditModalProps = ModalBaseProps & {
  kind: UserKindPath;
  id: string;
  /** Shown in the title before the detail loads. */
  username: string;
};

/** Every tab gets the loaded detail and the route ref. */
export type TabProps = {
  kind: UserKindPath;
  id: string;
  detail: UserDetail;
  formId: string;
};

export type ProfileFormValues = InferType<typeof profileSchema>;
export type SettingsFormValues = InferType<typeof settingsSchema>;
export type MessageFormValues = InferType<typeof messageSchema>;
/** Row key → checkbox + threshold (rows without a threshold keep `value: 0`). */
export type NotifyFormValues = { notify: Record<string, { enabled: boolean; value: number }> };
export type SharesFormValues = InferType<typeof sharesSchema>;

export type LeagueLimits = Record<string, number>;
export type SportLimits = {
  prematch: number;
  live: number;
  /** League id → market → max stake. */
  leagues: Record<string, LeagueLimits>;
};
export type LimitsFormValues = { sports: Record<string, SportLimits> };

export type ModulesFormValues = { modules: Record<string, boolean> };
