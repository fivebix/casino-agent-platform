import { decryptSecret, encryptSecret } from './secret-cipher';

const K = 'ab'.repeat(32);

describe('secret cipher', () => {
  it('round-trips and never repeats a ciphertext', () => {
    const a = encryptSecret('{"apiKey":"x"}', K);
    const b = encryptSecret('{"apiKey":"x"}', K);
    expect(a).not.toBe(b);
    expect(decryptSecret(a, K)).toBe('{"apiKey":"x"}');
  });

  it('fails on a wrong key or a tampered payload', () => {
    const a = encryptSecret('secret', K);
    expect(() => decryptSecret(a, 'cd'.repeat(32))).toThrow();
    const parts = a.split(':');
    parts[2] = parts[2].replace(/.$/, (c) => (c === '0' ? '1' : '0'));
    expect(() => decryptSecret(parts.join(':'), K)).toThrow();
  });

  it('rejects a key of the wrong length', () => {
    expect(() => encryptSecret('x', 'abcd')).toThrow('64 hex');
  });
});
