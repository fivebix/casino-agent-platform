import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** POST /v1/tenants/{operatorId}/agents */
export class CreateAgentDto {
  @IsOptional() @IsString() parentAgentId?: string;
  @IsString() @MaxLength(120) username!: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsString() @MaxLength(200) tempPassword!: string;
  @IsOptional() @IsBoolean() canCreateAgents?: boolean;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) creditLimit?: number;
}

/** PATCH /v1/tenants/{operatorId}/agents/{agentId} — partial update. */
export class UpdateAgentDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsBoolean() canCreateAgents?: boolean;
  @IsOptional() @IsIn(['active', 'blocked']) status?: 'active' | 'blocked';
}

/** Credit a direct child agent (or, from the operator, a top-level agent). */
export class MoneyMoveDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() amount!: number;
  @IsOptional() @IsString() @MaxLength(500) comment?: string;
}

export class ActivityEventDto {
  @IsString() eventId!: string;
  @IsString() type!: string;
  @IsString() playerId!: string;
  @IsString() agentId!: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) amount?: number;
  @IsOptional() @IsString() roundId?: string;
  @IsISO8601() occurredAt!: string;
}

export class EventsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ActivityEventDto)
  events!: ActivityEventDto[];
}

export class ClosingDto {
  @IsOptional() @IsISO8601() closeAt?: string;
  @IsOptional() @IsString() timeZone?: string;
  @IsOptional() @IsNumber() @Min(0) pauseMinutes?: number;
}
