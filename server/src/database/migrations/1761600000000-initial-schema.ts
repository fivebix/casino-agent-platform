import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1761600000000 implements MigrationInterface {
  name = 'InitialSchema1761600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await queryRunner.query(`CREATE TABLE "activity_events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "eventId" character varying NOT NULL, "type" character varying NOT NULL, "platformPlayerId" character varying NOT NULL, "amount" numeric(18,2), "roundId" character varying, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_activity_tenant_event" UNIQUE ("tenantId", "eventId"), CONSTRAINT "PK_f8e8d9dbf64f93f58ae52b4a9e4" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_fbd567a60bcf5680b8bc2717d9" ON "activity_events" ("tenantId") `);
    await queryRunner.query(`CREATE INDEX "IDX_12fa1fd83637af3ee724891b7c" ON "activity_events" ("platformPlayerId") `);
    await queryRunner.query(`CREATE INDEX "IDX_c90100dc095860a038a6c4a746" ON "activity_events" ("occurredAt") `);
    await queryRunner.query(`CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "parentId" uuid, "path" character varying NOT NULL, "username" character varying NOT NULL, "name" character varying, "passwordHash" character varying NOT NULL, "mustChangePassword" boolean NOT NULL DEFAULT true, "canCreateAgents" boolean NOT NULL DEFAULT true, "status" character varying NOT NULL DEFAULT 'active', "balance" numeric(18,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_agents_tenant_username" UNIQUE ("tenantId", "username"), CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_388079d7d4e52de7d14a939303" ON "agents" ("tenantId") `);
    await queryRunner.query(`CREATE INDEX "IDX_d38fba4a77435ddb1c8f1ac2f0" ON "agents" ("path") `);
    await queryRunner.query(`CREATE TABLE "corrections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "agentId" uuid NOT NULL, "agentPath" character varying NOT NULL, "amount" numeric(18,2) NOT NULL, "comment" character varying NOT NULL, "createdByAgentId" uuid NOT NULL, CONSTRAINT "PK_c362438b2b0fcce02e21e4c24c9" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_5967e7c5efdffd743133eaf56f" ON "corrections" ("tenantId") `);
    await queryRunner.query(`CREATE TABLE "idempotency_keys" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "key" character varying(80) NOT NULL, "requestHash" character varying(64) NOT NULL, "response" text, CONSTRAINT "UQ_idem_tenant_key" UNIQUE ("tenantId", "key"), CONSTRAINT "PK_8ad20779ad0411107a56e53d0f6" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "agentId" uuid NOT NULL, "type" character varying NOT NULL, "amount" numeric(18,2) NOT NULL, "balanceAfter" numeric(18,2), "platformBalance" numeric(18,2), "counterpartyAgentId" uuid, "platformPlayerId" character varying, "comment" character varying, "idempotencyKey" character varying, "status" character varying NOT NULL DEFAULT 'completed', "error" character varying, CONSTRAINT "UQ_ledger_tenant_key_type" UNIQUE ("tenantId", "idempotencyKey", "type"), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_d710b16d5c43a2dd4dda5121d2" ON "ledger_entries" ("tenantId") `);
    await queryRunner.query(`CREATE INDEX "IDX_8aba23bad300f06becacd2a6ea" ON "ledger_entries" ("agentId") `);
    await queryRunner.query(`CREATE INDEX "IDX_7ecad3e451bc578d31661685e5" ON "ledger_entries" ("status") `);
    await queryRunner.query(`CREATE TABLE "players" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "platformPlayerId" character varying NOT NULL, "agentId" uuid NOT NULL, "agentPath" character varying NOT NULL, "username" character varying, "frozen" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_players_tenant_platform" UNIQUE ("tenantId", "platformPlayerId"), CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_8d833263136af15b89161a92a5" ON "players" ("tenantId") `);
    await queryRunner.query(`CREATE INDEX "IDX_0fac6a67c1c78773c0a22b048d" ON "players" ("agentId") `);
    await queryRunner.query(`CREATE INDEX "IDX_7c443b1518ce3e58a729dddef1" ON "players" ("agentPath") `);
    await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "operatorId" character varying NOT NULL, "name" character varying NOT NULL, "platformUrl" character varying, "credentialsEnc" text, "creditLimit" numeric(18,2), "issuedCredit" numeric(18,2) NOT NULL DEFAULT '0', "timeZone" character varying NOT NULL DEFAULT 'UTC', "pauseMinutes" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_tenants_operator" UNIQUE ("operatorId"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "weeks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "weekId" character varying NOT NULL, "startsAt" TIMESTAMP WITH TIME ZONE, "closeAt" TIMESTAMP WITH TIME ZONE NOT NULL, "pauseMinutes" integer NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'closing', "error" character varying, CONSTRAINT "UQ_weeks_tenant_week" UNIQUE ("tenantId", "weekId"), CONSTRAINT "PK_003488ee2ca80ef0c85a02a8065" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_3c188d4ea58f3f9558c1d8883d" ON "weeks" ("tenantId") `);
    await queryRunner.query(`CREATE TABLE "week_snapshots" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "weekId" character varying NOT NULL, "subjectType" character varying NOT NULL, "subjectId" character varying NOT NULL, "path" character varying NOT NULL, "turnover" numeric(18,2) NOT NULL, "calc" numeric(18,2) NOT NULL, "corrections" numeric(18,2) NOT NULL DEFAULT '0', "closingBalance" numeric(18,2), CONSTRAINT "UQ_snapshot_week_subject" UNIQUE ("tenantId", "weekId", "subjectType", "subjectId"), CONSTRAINT "PK_b0235928e6ccac3e0278d08a344" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_f62514b23476552e51f3e31d2f" ON "week_snapshots" ("tenantId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_f62514b23476552e51f3e31d2f"`);
    await queryRunner.query(`DROP TABLE "week_snapshots"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3c188d4ea58f3f9558c1d8883d"`);
    await queryRunner.query(`DROP TABLE "weeks"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7c443b1518ce3e58a729dddef1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0fac6a67c1c78773c0a22b048d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8d833263136af15b89161a92a5"`);
    await queryRunner.query(`DROP TABLE "players"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7ecad3e451bc578d31661685e5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8aba23bad300f06becacd2a6ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d710b16d5c43a2dd4dda5121d2"`);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(`DROP TABLE "idempotency_keys"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5967e7c5efdffd743133eaf56f"`);
    await queryRunner.query(`DROP TABLE "corrections"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d38fba4a77435ddb1c8f1ac2f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_388079d7d4e52de7d14a939303"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c90100dc095860a038a6c4a746"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_12fa1fd83637af3ee724891b7c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fbd567a60bcf5680b8bc2717d9"`);
    await queryRunner.query(`DROP TABLE "activity_events"`);
  }
}
