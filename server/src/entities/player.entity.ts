import { Column, Entity, Index, Unique } from 'typeorm';
import { Base } from './base';

@Entity('players')
@Unique('UQ_players_tenant_platform', ['tenantId', 'platformPlayerId'])
export class Player extends Base {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar' })
  platformPlayerId!: string;

  @Index()
  @Column({ type: 'uuid' })
  agentId!: string;

  /** Copy of the owning agent's path, so roll-ups need no join. */
  @Index()
  @Column({ type: 'varchar' })
  agentPath!: string;

  @Column({ type: 'varchar', nullable: true })
  username?: string | null;

  @Column({ type: 'boolean', default: false })
  frozen!: boolean;
}
