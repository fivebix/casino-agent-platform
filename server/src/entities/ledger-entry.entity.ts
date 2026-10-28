import { Column, Entity, Index, Unique } from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Base } from './base';

export type LedgerType =
  | 'tenant_grant'
  | 'tenant_withdraw'
  | 'grant_in'
  | 'grant_out'
  | 'withdraw_in'
  | 'withdraw_out'
  | 'player_credit'
  | 'player_withdraw';

export type LedgerStatus = 'pending' | 'completed' | 'failed';

/** Append-only. `amount` is signed from the account owner's point of view. */
@Entity('ledger_entries')
@Unique('UQ_ledger_tenant_key_type', ['tenantId', 'idempotencyKey', 'type'])
export class LedgerEntry extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'varchar' })
  type!: LedgerType;

  @Column({ type: 'numeric', precision: 18, scale: 2, transformer: numeric })
  amount!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, transformer: numeric })
  balanceAfter?: number | null;

  @Column({ type: 'uuid', nullable: true })
  counterpartyAgentId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  platformPlayerId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  comment?: string | null;

  @Column({ type: 'varchar', nullable: true })
  idempotencyKey?: string | null;

  /** Player moves are written pending, then completed once the platform confirms. */
  @Index()
  @Column({ type: 'varchar', default: 'completed' })
  status!: LedgerStatus;

  @Column({ type: 'varchar', nullable: true })
  error?: string | null;
}
