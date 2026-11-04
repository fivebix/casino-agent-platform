/** Row key (a `SubscribeSettings` field) → checkbox + threshold (flag rows keep `value: 0`). */
export type SubscribeFormValues = {
  rows: Record<string, { enabled: boolean; value: number }>;
};
