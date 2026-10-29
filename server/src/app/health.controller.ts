import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get('health')
  async health(): Promise<{ status: string; db: string }> {
    let db = 'down';
    try {
      await this.ds.query('SELECT 1');
      db = 'up';
    } catch {
      db = 'down';
    }
    return { status: db === 'up' ? 'ok' : 'degraded', db };
  }
}
