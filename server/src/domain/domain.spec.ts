import { childPath, depthOf, isInSubtree, isStrictDescendant, ROOT_PATH } from './agent-path';
import { assertGrant, assertWithdraw, CreditRuleError } from './credit-rules';
import { aggregate, playerTotals } from './rollup';

describe('agent path', () => {
  const a = childPath(ROOT_PATH, 'a');
  const a1 = childPath(a, 'a1');
  const ab = childPath(ROOT_PATH, 'ab');

  it('builds nested paths of any depth', () => {
    let p = ROOT_PATH;
    for (let i = 0; i < 50; i++) p = childPath(p, `n${i}`);
    expect(depthOf(p)).toBe(50);
  });

  it('subtree checks use whole path segments, not string prefixes', () => {
    expect(isInSubtree(a1, a)).toBe(true);
    expect(isInSubtree(a, a)).toBe(true);
    expect(isStrictDescendant(a, a)).toBe(false);
    expect(isInSubtree(ab, a)).toBe(false); // "/ab/" is not under "/a/"
  });
});

describe('credit rules', () => {
  const code = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      return (e as CreditRuleError).code;
    }
    return 'OK';
  };

  it('an agent cannot give more than they hold', () => {
    expect(code(() => assertGrant({ amount: 100, giverBalance: 99.99 }))).toBe('INSUFFICIENT_CREDIT');
    expect(code(() => assertGrant({ amount: 100, giverBalance: 100 }))).toBe('OK');
  });

  it('rejects zero, negative and sub-cent amounts', () => {
    for (const amount of [0, -5, 1.005, NaN]) {
      expect(code(() => assertGrant({ amount, giverBalance: 1000 }))).toBe('INVALID_AMOUNT');
    }
  });

  it('the tenant limit caps total credit issued to top-level agents', () => {
    expect(code(() => assertGrant({ amount: 600, tenantIssued: 500, tenantLimit: 1000 }))).toBe('TENANT_LIMIT_EXCEEDED');
    expect(code(() => assertGrant({ amount: 500, tenantIssued: 500, tenantLimit: 1000 }))).toBe('OK');
    expect(code(() => assertGrant({ amount: 1e9, tenantIssued: 0, tenantLimit: null }))).toBe('OK');
  });

  it('cannot withdraw more than the receiver holds', () => {
    expect(code(() => assertWithdraw({ amount: 50.01, receiverBalance: 50 }))).toBe('NOTHING_TO_WITHDRAW');
    expect(code(() => assertWithdraw({ amount: 50, receiverBalance: 50 }))).toBe('OK');
  });

  it('is exact in cents (0.1 + 0.2 style float traps)', () => {
    expect(code(() => assertGrant({ amount: 0.3, giverBalance: 0.1 + 0.2 }))).toBe('OK');
  });
});

describe('roll-ups', () => {
  it('player totals: calc is wins and refunds minus bets; turnover nets refunds', () => {
    expect(
      playerTotals([
        { type: 'bet', amount: 20 },
        { type: 'win', amount: 0 },
        { type: 'bet', amount: 25 },
        { type: 'win', amount: 50 },
        { type: 'bet', amount: 10 },
        { type: 'refund', amount: 10 },
      ]),
    ).toEqual({ turnover: 45, calc: 5 });
  });

  it('ignores adjustments and link events so credits are never counted as play', () => {
    expect(
      playerTotals([
        { type: 'adjustment', amount: 100 },
        { type: 'player_linked', amount: null },
        { type: 'bet', amount: 10 },
      ]),
    ).toEqual({ turnover: 10, calc: -10 });
  });

  it('an agent number is exactly the sum of the players below it (the -5 rule)', () => {
    const a = childPath(ROOT_PATH, 'a');
    const a1 = childPath(a, 'a1');
    const b = childPath(ROOT_PATH, 'b');
    const players = [
      { agentPath: a1, totals: { turnover: 250, calc: -5 } },
      { agentPath: a, totals: { turnover: 100, calc: 12 } },
      { agentPath: b, totals: { turnover: 70, calc: -40 } },
    ];
    expect(aggregate(a, players, []).calc).toBe(7);
    expect(aggregate(a1, players, []).calc).toBe(-5);
    expect(aggregate(ROOT_PATH, players, []).calc).toBe(-33);
    expect(aggregate(b, players, []).turnover).toBe(70);
  });

  it('corrections roll up the tree with the numbers', () => {
    const a = childPath(ROOT_PATH, 'a');
    const a1 = childPath(a, 'a1');
    const players = [{ agentPath: a1, totals: { turnover: 10, calc: -5 } }];
    const r = aggregate(a, players, [{ agentPath: a1, amount: 5 }]);
    expect(r).toMatchObject({ calc: -5, corrections: 5, calcWithCorrections: 0 });
  });
});
