import { Column, Entity, Index, Unique } from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Base } from './base';

@Entity('activity_events')
@Unique('UQ_activity_tenant_event', ['tenantId', 'eventId'])
export class ActivityEvent extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar' })
  eventId!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Index()
  @Column({ type: 'varchar' })
  platformPlayerId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, transformer: numeric })
  amount?: number | null;

  @Column({ type: 'varchar', nullable: true })
  roundId?: string | null;

  @Index()
  @Column({ type: 'timestamptz' })
  occurredAt!: Date;
}
