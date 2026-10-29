import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Agent, Tenant } from '../entities';
import { AgentsService } from '../services/agents.service';
import { CreditService, CreditResult } from '../services/credit.service';
import { IdempotencyService } from '../services/idempotency.service';
import { CreateAgentDto, MoneyMoveDto, UpdateAgentDto } from './dto';
import { SignedRequest } from './request';
import { SignatureGuard } from './signature.guard';

interface AgentView extends Record<string, unknown> {
  id: string;
  operatorId: string;
  parentAgentId: string | null;
  username: string;
  name: string | null;
  canCreateAgents: boolean;
}

/** A node in the agent tree, with the derived level and the live balance, for the UI table. */
interface AgentListItem extends AgentView {
  balance: number;
  status: string;
  path: string;
  level: number;
}

/** Backend-facing agent management. Called by the sweepstakes backend for the operator admin. */
@Controller('v1/tenants/:operatorId')
@UseGuards(SignatureGuard)
export class AgentsController {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly agents: AgentsService,
    private readonly credit: CreditService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /** The whole agent tree for this operator, with live balances — the UI's source of truth. */
  @Get('agents')
  async list(@Req() req: SignedRequest): Promise<AgentListItem[]> {
    const tenant = req.tenant!;
    const rows = await this.agents.subtree({ kind: 'tenant' }, tenant.id);
    return rows.map((a) => listItem(a, tenant));
  }

  /** Rename, toggle agent-creation rights, or block/unblock an agent. */
  @Patch('agents/:agentId')
  async update(
    @Req() req: SignedRequest,
    @Param('agentId') agentId: string,
    @Body() body: UpdateAgentDto,
  ): Promise<AgentListItem> {
    const tenant = req.tenant!;
    const agent = await this.agents.updateAgent({ kind: 'tenant' }, tenant.id, agentId, body);
    return listItem(agent, tenant);
  }

  /** Delete an agent (only if it has no sub-agents and a zero balance). */
  @Delete('agents/:agentId')
  async remove(@Req() req: SignedRequest, @Param('agentId') agentId: string): Promise<{ deleted: boolean; id: string }> {
    const tenant = req.tenant!;
    const { id } = await this.agents.deleteAgent({ kind: 'tenant' }, tenant.id, agentId);
    return { deleted: true, id };
  }

  @Post('agents')
  async create(
    @Req() req: SignedRequest,
    @Body() body: CreateAgentDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<AgentView> {
    requireKey(key);
    const tenant = req.tenant!;
    return this.idempotency.run(tenant.id, key!, body as unknown as Record<string, unknown>, async () => {
      // The operator admin may set the operator-wide credit limit when opening the root agent.
      if (body.creditLimit != null && !body.parentAgentId) {
        await this.ds.getRepository(Tenant).update(tenant.id, { creditLimit: body.creditLimit });
      }
      const agent = await this.agents.createAgent(
        { kind: 'tenant' },
        {
          tenantId: tenant.id,
          parentId: body.parentAgentId ?? null,
          username: body.username,
          name: body.name,
          tempPassword: body.tempPassword,
          canCreateAgents: body.canCreateAgents,
        },
      );
      return view(agent.id, tenant, agent.parentId ?? null, agent.username, agent.name ?? null, agent.canCreateAgents);
    });
  }

  @Post('agents/:agentId/credit')
  credit_(
    @Req() req: SignedRequest,
    @Param('agentId') agentId: string,
    @Body() body: MoneyMoveDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<CreditResult> {
    requireKey(key);
    return this.credit.grant({ kind: 'tenant' }, req.tenant!.id, agentId, body.amount, key!, body.comment);
  }

  @Post('agents/:agentId/withdraw')
  withdraw(
    @Req() req: SignedRequest,
    @Param('agentId') agentId: string,
    @Body() body: MoneyMoveDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<CreditResult> {
    requireKey(key);
    return this.credit.withdraw({ kind: 'tenant' }, req.tenant!.id, agentId, body.amount, key!, body.comment);
  }
}

function requireKey(key?: string): void {
  if (!key) throw new BadRequestException('Idempotency-Key header is required');
}

/** Map a stored agent to the shape the UI table consumes. */
function listItem(a: Agent, tenant: Tenant): AgentListItem {
  return {
    id: a.id,
    operatorId: tenant.operatorId,
    parentAgentId: a.parentId ?? null,
    username: a.username,
    name: a.name ?? null,
    canCreateAgents: a.canCreateAgents,
    balance: a.balance,
    status: a.status,
    path: a.path,
    level: a.path.split('/').filter(Boolean).length,
  };
}

function view(
  id: string,
  tenant: Tenant,
  parentAgentId: string | null,
  username: string,
  name: string | null,
  canCreateAgents: boolean,
): AgentView {
  return { id, operatorId: tenant.operatorId, parentAgentId, username, name, canCreateAgents };
}
