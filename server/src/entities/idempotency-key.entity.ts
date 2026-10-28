import { Column, Entity, Unique } from 'typeorm';
import { Base } from './base';

@Entity('idempotency_keys')
@Unique('UQ_idem_tenant_key', ['tenantId', 'key'])
export class IdempotencyKey extends Base {
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 80 })
  key!: string;

  @Column({ type: 'varchar', length: 64 })
  requestHash!: string;

  @Column({ type: 'simple-json', nullable: true })
  response?: Record<string, unknown> | null;
}
