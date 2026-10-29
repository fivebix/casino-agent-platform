import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // rawBody: keeps the exact bytes so the HMAC signature can be verified.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  // Confirm the database connection explicitly. TypeOrmModule has already
  // connected (or the app would not have started), so report what we are on.
  const ds = app.get<DataSource>(getDataSourceToken());
  const opts = ds.options as { host?: string; port?: number; database?: unknown; ssl?: unknown };
  if (ds.isInitialized) {
    try {
      await ds.query('SELECT 1');
      logger.log(
        `Database connected: ${opts.host}:${opts.port}/${String(opts.database)} (SSL ${opts.ssl ? 'on' : 'off'})`,
      );
    } catch (err) {
      logger.error(`Database reachable check failed: ${(err as Error).message}`);
    }
  } else {
    logger.error('Database is NOT initialized');
  }

  const port = Number(config.get('PORT') ?? 4100);
  await app.listen(port);
  logger.log(`Agent platform server listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start', err);
  process.exit(1);
});
