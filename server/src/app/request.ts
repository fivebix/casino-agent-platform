import { Request } from 'express';
import { Tenant } from '../entities';

/** An inbound request after the signature guard has authenticated the operator. */
export interface SignedRequest extends Request {
  rawBody?: Buffer;
  tenant?: Tenant;
}
