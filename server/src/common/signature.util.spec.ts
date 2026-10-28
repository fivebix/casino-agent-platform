import {
  isFreshTimestamp,
  signAgentRequest,
  verifyAgentSignature,
} from './signature.util';

describe('signature util', () => {
  // Pinned vector. The same secret, timestamp and body must give this hex in
  // the sweepstakes backend (src/agent/utils/signature.util.ts). If this test
  // changes, the two services stop understanding each other.
  const secret = 'test-secret';
  const ts = '1700000000';
  const body = '{"amount":100}';
  const expected = 'dc9ec957622f8d1f7f7e1a5e17ce747c58a4fd577544848668b6d2010808fea1';

  it('matches the pinned cross-repo vector', () => {
    expect(signAgentRequest(secret, ts, body)).toBe(expected);
    expect(signAgentRequest(secret, ts, Buffer.from(body))).toBe(expected);
  });

  it('verifies a valid signature and rejects tampering', () => {
    expect(verifyAgentSignature(secret, ts, body, expected)).toBe(true);
    expect(verifyAgentSignature(secret, ts, '{"amount":999}', expected)).toBe(false);
    expect(verifyAgentSignature('other', ts, body, expected)).toBe(false);
    expect(verifyAgentSignature(secret, ts, body, 'zz')).toBe(false);
    expect(verifyAgentSignature(secret, ts, body, '')).toBe(false);
  });

  it('treats timestamps outside the 5 minute window as stale', () => {
    const now = 1700000000 * 1000;
    expect(isFreshTimestamp('1700000000', now)).toBe(true);
    expect(isFreshTimestamp('1699999600', now)).toBe(false);
    expect(isFreshTimestamp('1700000400', now)).toBe(false);
    expect(isFreshTimestamp('abc', now)).toBe(false);
  });
});
