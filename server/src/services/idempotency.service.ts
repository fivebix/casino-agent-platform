import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { DomainError } from '../common/domain-error';
import { IdempotencyKey } from '../entities';

/** Runs `fn` once per (tenant, key); a repeat returns the stored response. */
export class IdempotencyService {
  constructor(private readonly ds: DataSource) {}

  async run<T extends Record<string, unknown>>(tenantId: string, key: string, body: unknown, fn: () => Promise<T>): Promise<T> {
    const repo = this.ds.getRepository(IdempotencyKey);
    const requestHash = createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');

    const existing = await repo.findOneBy({ tenantId, key });
    if (existing) return this.replay<T>(existing, requestHash);

    let row: IdempotencyKey;
    try {
      row = await repo.save({ tenantId, key, requestHash });
    } catch {
      const raced = await repo.findOneBy({ tenantId, key });
      if (raced) return this.replay<T>(raced, requestHash);
      throw new DomainError('IDEMPOTENCY_CONFLICT');
    }
    try {
      const response = await fn();
      await repo.update(row.id, { response } as never);
      return response;
    } catch (err) {
      await repo.delete(row.id);
      throw err;
    }
  }

  private replay<T>(row: IdempotencyKey, requestHash: string): T {
    if (row.requestHash !== requestHash || !row.response) throw new DomainError('IDEMPOTENCY_CONFLICT');
    return row.response as T;
  }
}
