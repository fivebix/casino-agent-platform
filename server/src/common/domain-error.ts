export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'USERNAME_TAKEN'
  | 'AGENT_BLOCKED'
  | 'CANNOT_CREATE_AGENTS'
  | 'NOT_A_DIRECT_CHILD'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PLAYER_FROZEN'
  | 'PLATFORM_ERROR'
  | 'COMMENT_REQUIRED';

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message?: string) {
    super(message ?? code);
  }
}
