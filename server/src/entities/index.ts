import { ActivityEvent } from './activity-event.entity';
import { Agent } from './agent.entity';
import { Correction } from './correction.entity';
import { IdempotencyKey } from './idempotency-key.entity';
import { LedgerEntry } from './ledger-entry.entity';
import { Player } from './player.entity';
import { Tenant } from './tenant.entity';
import { Week, WeekSnapshot } from './week.entity';

export const ENTITIES = [
  Tenant,
  Agent,
  LedgerEntry,
  Player,
  ActivityEvent,
  Correction,
  Week,
  WeekSnapshot,
  IdempotencyKey,
];
export {
  ActivityEvent,
  Agent,
  Correction,
  IdempotencyKey,
  LedgerEntry,
  Player,
  Tenant,
  Week,
  WeekSnapshot,
};
