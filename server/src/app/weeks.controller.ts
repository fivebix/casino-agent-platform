import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Week } from '../entities';
import { ClosingDto } from './dto';
import { SignedRequest } from './request';
import { SignatureGuard } from './signature.guard';

/** The platform tells us an operator's weekly close time was reached. Idempotent on weekId. */
@Controller('v1/weeks')
@UseGuards(SignatureGuard)
export class WeeksController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Post(':weekId/closing')
  @HttpCode(202)
  async closing(
    @Req() req: SignedRequest,
    @Param('weekId') weekId: string,
    @Body() body: ClosingDto,
  ): Promise<{ weekId: string; status: string }> {
    const tenantId = req.tenant!.id;
    await this.ds
      .createQueryBuilder()
      .insert()
      .into(Week)
      .values({
        tenantId,
        weekId,
        closeAt: body.closeAt ? new Date(body.closeAt) : new Date(),
        pauseMinutes: body.pauseMinutes ?? 0,
        status: 'closing',
      })
      .orIgnore()
      .execute();
    return { weekId, status: 'accepted' };
  }
}
