import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTITIES } from '../entities';
import { AgentsController } from './agents.controller';
import { DomainErrorFilter } from './domain-error.filter';
import { EventsController } from './events.controller';
import { HealthController } from './health.controller';
import { serviceProviders } from './providers';
import { SignatureGuard } from './signature.guard';
import { WeeksController } from './weeks.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: ENTITIES,
        migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
        uuidExtension: 'pgcrypto',
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
  controllers: [HealthController, AgentsController, EventsController, WeeksController],
  providers: [
    SignatureGuard,
    ...serviceProviders,
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    },
  ],
})
export class AppModule {}
