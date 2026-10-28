import { Column, Entity, Index, Unique } from 'typeorm';
import { numeric } from '../common/numeric.transformer';
import { Base } from './base';

export type AgentStatus = 'active' | 'blocked';

@Entity('agents')
@Unique('UQ_agents_tenant_username', ['tenantId', 'username'])
export class Agent extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  /** Null for a top-level agent (a child of the operator admin). */
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @Index()
  @Column({ type: 'varchar' })
  path!: string;

  @Column({ type: 'varchar' })
  username!: string;

  @Column({ type: 'varchar', nullable: true })
  name?: string | null;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({ type: 'boolean', default: true })
  mustChangePassword!: boolean;

  @Column({ type: 'boolean', default: true })
  canCreateAgents!: boolean;

  @Column({ type: 'varchar', default: 'active' })
  status!: AgentStatus;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, transformer: numeric })
  balance!: number;
}
