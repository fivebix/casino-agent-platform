import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DataSource, Like } from 'typeorm';
import { DomainError } from '../common/domain-error';
import { childPath, isInSubtree, isStrictDescendant, ROOT_PATH } from '../domain/agent-path';
import { Agent } from '../entities';
import { Actor } from './actor';

export interface CreateAgentInput {
  tenantId: string;
  parentId?: string | null;
  username: string;
  name?: string;
  tempPassword: string;
  canCreateAgents?: boolean;
}

export class AgentsService {
  constructor(private readonly ds: DataSource, private readonly bcryptRounds = 10) {}

  async createAgent(actor: Actor, input: CreateAgentInput): Promise<Agent> {
    const repo = this.ds.getRepository(Agent);
    let parent: Agent | null = null;

    if (actor.kind === 'agent') {
      this.assertActive(actor.agent);
      if (!actor.agent.canCreateAgents) throw new DomainError('CANNOT_CREATE_AGENTS');
      // An agent creates below themselves: directly, or anywhere in their subtree.
      parent = input.parentId ? await this.inTenant(input.tenantId, input.parentId) : actor.agent;
      if (!isInSubtree(parent.path, actor.agent.path)) throw new DomainError('FORBIDDEN');
    } else if (input.parentId) {
      parent = await this.inTenant(input.tenantId, input.parentId);
    }

    const id = randomUUID();
    try {
      return await repo.save({
        id,
        tenantId: input.tenantId,
        parentId: parent?.id ?? null,
        path: childPath(parent?.path ?? ROOT_PATH, id),
        username: input.username,
        name: input.name ?? null,
        passwordHash: await bcrypt.hash(input.tempPassword, this.bcryptRounds),
        mustChangePassword: true,
        canCreateAgents: input.canCreateAgents ?? true,
      });
    } catch (e) {
      if (await repo.findOneBy({ tenantId: input.tenantId, username: input.username })) {
        throw new DomainError('USERNAME_TAKEN');
      }
      throw e;
    }
  }

  async setBlocked(actor: Actor, tenantId: string, agentId: string, blocked: boolean): Promise<Agent> {
    const target = await this.inTenant(tenantId, agentId);
    if (actor.kind === 'agent') {
      this.assertActive(actor.agent);
      if (!isStrictDescendant(target.path, actor.agent.path)) throw new DomainError('FORBIDDEN');
    }
    target.status = blocked ? 'blocked' : 'active';
    return this.ds.getRepository(Agent).save(target);
  }

  /** The actor and everything below them, parents before children. */
  async subtree(actor: Actor, tenantId: string): Promise<Agent[]> {
    const prefix = actor.kind === 'agent' ? actor.agent.path : ROOT_PATH;
    const rows = await this.ds.getRepository(Agent).find({
      where: { tenantId, path: Like(`${prefix}%`) },
    });
    return rows.sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));
  }

  private assertActive(agent: Agent): void {
    if (agent.status !== 'active') throw new DomainError('AGENT_BLOCKED');
  }

  private async inTenant(tenantId: string, id: string): Promise<Agent> {
    const a = await this.ds.getRepository(Agent).findOneBy({ id, tenantId });
    if (!a) throw new DomainError('NOT_FOUND');
    return a;
  }
}
