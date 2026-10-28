import { Column, Entity, Unique } from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Base } from './base';

@Entity('tenants')
@Unique('UQ_tenants_operator', ['operatorId'])
export class Tenant extends Base {
  /** The operator's id on the sweepstakes platform. */
  @Column({ type: 'varchar' })
  operatorId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  platformUrl?: string | null;

  /** AES-256-GCM encrypted JSON {apiKey, signingSecret}. */
  @Column({ type: 'text', nullable: true })
  credentialsEnc?: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, transformer: numeric })
  creditLimit?: number | null;

  /** Credit the tenant has handed to top-level agents, net of withdrawals. */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, transformer: numeric })
  issuedCredit!: number;

  @Column({ type: 'varchar', default: 'UTC' })
  timeZone!: string;

  @Column({ type: 'int', default: 0 })
  pauseMinutes!: number;
}
