import { Column, Entity, Index, Unique } from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Base } from './base';

export type WeekStatus = 'closing' | 'snapshotted' | 'reset' | 'failed';

@Entity('weeks')
@Unique('UQ_weeks_tenant_week', ['tenantId', 'weekId'])
export class Week extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar' })
  weekId!: string;

  /** Start of the week (the previous close), null for the first one. */
  @Column({ type: 'timestamptz', nullable: true })
  startsAt?: Date | null;

  @Column({ type: 'timestamptz' })
  closeAt!: Date;

  @Column({ type: 'int', default: 0 })
  pauseMinutes!: number;

  @Column({ type: 'varchar', default: 'closing' })
  status!: WeekStatus;

  @Column({ type: 'varchar', nullable: true })
  error?: string | null;
}

@Entity('week_snapshots')
@Unique('UQ_snapshot_week_subject', ['tenantId', 'weekId', 'subjectType', 'subjectId'])
export class WeekSnapshot extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar' })
  weekId!: string;

  @Column({ type: 'varchar' })
  subjectType!: 'agent' | 'player';

  @Column({ type: 'varchar' })
  subjectId!: string;

  @Column({ type: 'varchar' })
  path!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, transformer: numeric })
  turnover!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, transformer: numeric })
  calc!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, transformer: numeric })
  corrections!: number;

  /** Agent credit balance, or the player's closing wallet balance from the platform. */
  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, transformer: numeric })
  closingBalance?: number | null;
}
