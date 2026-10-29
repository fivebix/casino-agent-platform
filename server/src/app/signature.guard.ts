import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { timingSafeEqual } from 'crypto';
import { DataSource } from 'typeorm';
import { decryptSecret } from '../common/secret-cipher';
import { isFreshTimestamp, verifyAgentSignature } from '../common/signature.util';
import { Tenant } from '../entities';
import { SignedRequest } from './request';

/**
 * Authenticates calls from the sweepstakes backend. Every request carries
 * X-Operator-Id, X-Api-Key, X-Timestamp and X-Signature (see contract/openapi.yaml).
 * The signature is HMAC-SHA256(signingSecret, `${timestamp}.${rawBody}`), with the
 * per-operator secret stored encrypted on the tenant. On success the tenant is
 * attached to the request for the controllers.
 */
@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SignedRequest>();
    const operatorId = header(req, 'x-operator-id');
    const apiKey = header(req, 'x-api-key');
    const timestamp = header(req, 'x-timestamp');
    const signature = header(req, 'x-signature');
    if (!operatorId || !apiKey || !timestamp || !signature) {
      throw new UnauthorizedException('Missing signature headers');
    }
    if (!isFreshTimestamp(timestamp)) throw new UnauthorizedException('Stale or invalid timestamp');

    // A path :operatorId must match the authenticated operator.
    const pathOperator = (req.params as Record<string, string> | undefined)?.operatorId;
    if (pathOperator && pathOperator !== operatorId) throw new UnauthorizedException('Operator mismatch');

    const tenant = await this.ds.getRepository(Tenant).findOneBy({ operatorId });
    if (!tenant || !tenant.credentialsEnc) throw new UnauthorizedException('Unknown operator');

    const keyHex = this.config.getOrThrow<string>('CREDENTIALS_KEY');
    let creds: { apiKey: string; signingSecret: string };
    try {
      creds = JSON.parse(decryptSecret(tenant.credentialsEnc, keyHex));
    } catch {
      throw new UnauthorizedException('Operator credentials unreadable');
    }

    if (!safeEqual(apiKey, creds.apiKey)) throw new UnauthorizedException('Bad API key');
    const rawBody = req.rawBody ?? Buffer.alloc(0);
    if (!verifyAgentSignature(creds.signingSecret, timestamp, rawBody, signature)) {
      throw new UnauthorizedException('Bad signature');
    }

    req.tenant = tenant;
    return true;
  }
}

function header(req: SignedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
