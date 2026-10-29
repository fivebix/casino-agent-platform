import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DomainError, DomainErrorCode } from '../common/domain-error';
import { CreditRuleCode } from '../domain/credit-rules';

type Code = DomainErrorCode | CreditRuleCode;

/** How each domain/credit error code surfaces over HTTP. */
const STATUS: Record<Code, number> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  USERNAME_TAKEN: HttpStatus.CONFLICT,
  IDEMPOTENCY_CONFLICT: HttpStatus.CONFLICT,
  AGENT_BLOCKED: HttpStatus.UNPROCESSABLE_ENTITY,
  CANNOT_CREATE_AGENTS: HttpStatus.FORBIDDEN,
  NOT_A_DIRECT_CHILD: HttpStatus.UNPROCESSABLE_ENTITY,
  PLAYER_FROZEN: HttpStatus.UNPROCESSABLE_ENTITY,
  PLATFORM_ERROR: HttpStatus.BAD_GATEWAY,
  COMMENT_REQUIRED: HttpStatus.UNPROCESSABLE_ENTITY,
  HAS_DESCENDANTS: HttpStatus.CONFLICT,
  NONZERO_BALANCE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_AMOUNT: HttpStatus.UNPROCESSABLE_ENTITY,
  INSUFFICIENT_CREDIT: HttpStatus.UNPROCESSABLE_ENTITY,
  NOTHING_TO_WITHDRAW: HttpStatus.UNPROCESSABLE_ENTITY,
  TENANT_LIMIT_EXCEEDED: HttpStatus.UNPROCESSABLE_ENTITY,
};

/** Turns DomainError and credit-rule errors (Error with a `code`) into clean JSON responses. */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      res.status(exception.getStatus()).json(typeof body === 'string' ? { error: body } : body);
      return;
    }

    const code = codeOf(exception);
    if (code && code in STATUS) {
      const status = STATUS[code as Code];
      res.status(status).json({ error: code, message: (exception as Error).message });
      return;
    }

    this.logger.error((exception as Error)?.stack ?? String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'INTERNAL', message: 'Internal server error' });
  }
}

function codeOf(e: unknown): string | undefined {
  if (e instanceof DomainError) return e.code;
  if (e && typeof e === 'object' && typeof (e as { code?: unknown }).code === 'string') {
    return (e as { code: string }).code;
  }
  return undefined;
}
