import { ConfigService } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { decryptSecret } from '../common/secret-cipher';
import { Tenant } from '../entities';
import { HttpPlatformClient, PlatformApi, PlatformCredentials } from '../platform/platform.client';
import { AgentsService } from '../services/agents.service';
import { CreditService } from '../services/credit.service';
import { IdempotencyService } from '../services/idempotency.service';
import { PlayerMoneyService } from '../services/player-money.service';
import { CREDENTIALS_RESOLVER, PLATFORM_API } from './tokens';

/** Resolves and decrypts a tenant's platform credentials for outbound calls. */
export type CredentialsResolver = (tenantId: string) => Promise<PlatformCredentials>;

/**
 * The domain services are plain classes constructed from a DataSource, so they
 * are wired here as factory providers rather than with @Injectable decorators.
 */
export const serviceProviders: Provider[] = [
  {
    provide: PLATFORM_API,
    useFactory: (config: ConfigService): PlatformApi =>
      new HttpPlatformClient(fetch, Number(config.get('PLATFORM_TIMEOUT_MS') ?? 10_000)),
    inject: [ConfigService],
  },
  {
    provide: CREDENTIALS_RESOLVER,
    useFactory: (ds: DataSource, config: ConfigService): CredentialsResolver => {
      const keyHex = config.getOrThrow<string>('CREDENTIALS_KEY');
      return async (tenantId: string): Promise<PlatformCredentials> => {
        const tenant = await ds.getRepository(Tenant).findOneBy({ id: tenantId });
        if (!tenant || !tenant.platformUrl || !tenant.credentialsEnc) {
          throw new Error(`Tenant ${tenantId} has no platform credentials`);
        }
        const { apiKey, signingSecret } = JSON.parse(decryptSecret(tenant.credentialsEnc, keyHex));
        return { platformUrl: tenant.platformUrl, operatorId: tenant.operatorId, apiKey, signingSecret };
      };
    },
    inject: [getDataSourceToken(), ConfigService],
  },
  {
    provide: AgentsService,
    useFactory: (ds: DataSource, config: ConfigService) =>
      new AgentsService(ds, Number(config.get('BCRYPT_ROUNDS') ?? 10)),
    inject: [getDataSourceToken(), ConfigService],
  },
  {
    provide: CreditService,
    useFactory: (ds: DataSource) => new CreditService(ds),
    inject: [getDataSourceToken()],
  },
  {
    provide: IdempotencyService,
    useFactory: (ds: DataSource) => new IdempotencyService(ds),
    inject: [getDataSourceToken()],
  },
  {
    provide: PlayerMoneyService,
    useFactory: (ds: DataSource, platform: PlatformApi, credentials: CredentialsResolver) =>
      new PlayerMoneyService(ds, platform, credentials),
    inject: [getDataSourceToken(), PLATFORM_API, CREDENTIALS_RESOLVER],
  },
];
