import { Agent } from '../entities';

/** Who is acting: the operator admin (through the sweepstakes backend) or an agent. */
export type Actor = { kind: 'tenant' } | { kind: 'agent'; agent: Agent };
