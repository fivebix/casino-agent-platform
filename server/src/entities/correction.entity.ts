import { Column, Entity, Index } from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Base } from './base';

/** Append-only. A correction is a signed sum plus a mandatory comment. */
@Entity('corrections')
export class Correction extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'varchar' })
  agentPath!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, transformer: numeric })
  amount!: number;

  @Column({ type: 'varchar' })
  comment!: string;

  @Column({ type: 'uuid' })
  createdByAgentId!: string;
}
