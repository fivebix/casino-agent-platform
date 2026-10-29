import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ActivityEvent } from '../entities';
import { EventsDto } from './dto';
import { SignedRequest } from './request';
import { SignatureGuard } from './signature.guard';

/** Activity pushed from the platform (bet, win, refund, adjustment, player_linked). */
@Controller('v1')
@UseGuards(SignatureGuard)
export class EventsController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Post('events')
  @HttpCode(202)
  async ingest(@Req() req: SignedRequest, @Body() body: EventsDto): Promise<{ accepted: number }> {
    const tenantId = req.tenant!.id;
    if (body.events.length === 0) return { accepted: 0 };

    const rows = body.events.map((e) => ({
      tenantId,
      eventId: e.eventId,
      type: e.type,
      platformPlayerId: e.playerId,
      amount: e.amount ?? null,
      roundId: e.roundId ?? null,
      occurredAt: new Date(e.occurredAt),
    }));

    // Duplicate eventIds are ignored (unique on tenantId + eventId).
    await this.ds
      .createQueryBuilder()
      .insert()
      .into(ActivityEvent)
      .values(rows)
      .orIgnore()
      .execute();

    return { accepted: rows.length };
  }
}
