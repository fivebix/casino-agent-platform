import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function key(hex: string): Buffer {
  const k = Buffer.from(hex, 'hex');
  if (k.length !== 32) throw new Error('CREDENTIALS_KEY must be 64 hex characters');
  return k;
}

/** AES-256-GCM, output "iv:tag:ciphertext" in hex. */
export function encryptSecret(plain: string, keyHex: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(keyHex), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('hex')).join(':');
}

export function decryptSecret(payload: string, keyHex: string): string {
  const [iv, tag, enc] = payload.split(':').map((h) => Buffer.from(h, 'hex'));
  const d = createDecipheriv('aes-256-gcm', key(keyHex), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
