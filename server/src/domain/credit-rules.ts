export type CreditRuleCode =
  | 'INVALID_AMOUNT'
  | 'INSUFFICIENT_CREDIT'
  | 'NOTHING_TO_WITHDRAW'
  | 'TENANT_LIMIT_EXCEEDED';

export class CreditRuleError extends Error {
  constructor(public readonly code: CreditRuleCode) {
    super(code);
  }
}

export const toCents = (amount: number): number => Math.round(amount * 100);
export const fromCents = (cents: number): number => cents / 100;

/** Positive, at most two decimals. Returns the amount in cents. */
export function validAmountCents(amount: number): number {
  const cents = toCents(amount);
  if (
    !Number.isFinite(amount) ||
    cents <= 0 ||
    Math.abs(cents - amount * 100) > 1e-6
  ) {
    throw new CreditRuleError('INVALID_AMOUNT');
  }
  return cents;
}

/**
 * An agent hands credit down. They cannot give more than they hold. A
 * top-level agent is funded by the tenant (the operator admin), whose total
 * outstanding credit is capped by the limit the operator admin set.
 */
export function assertGrant(args: {
  amount: number;
  giverBalance?: number; // undefined when the tenant is the giver
  tenantIssued?: number;
  tenantLimit?: number | null;
}): number {
  const cents = validAmountCents(args.amount);
  if (args.giverBalance !== undefined) {
    if (cents > toCents(args.giverBalance)) {
      throw new CreditRuleError('INSUFFICIENT_CREDIT');
    }
    return cents;
  }
  if (args.tenantLimit !== null && args.tenantLimit !== undefined) {
    if (toCents(args.tenantIssued ?? 0) + cents > toCents(args.tenantLimit)) {
      throw new CreditRuleError('TENANT_LIMIT_EXCEEDED');
    }
  }
  return cents;
}

/** Taking credit back cannot exceed what the receiver holds. */
export function assertWithdraw(args: {
  amount: number;
  receiverBalance: number;
}): number {
  const cents = validAmountCents(args.amount);
  if (cents > toCents(args.receiverBalance)) {
    throw new CreditRuleError('NOTHING_TO_WITHDRAW');
  }
  return cents;
}
