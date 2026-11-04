/** Cookie the proxy writes with the subdomain it resolved from the Host header. */
export const TENANT_COOKIE = 'agent_tenant';
/** Request header the proxy forwards to server components. */
export const TENANT_HEADER = 'x-tenant-subdomain';

export const DEFAULT_SUBDOMAIN = process.env.NEXT_PUBLIC_DEFAULT_SUBDOMAIN ?? '';

/** Host labels that name infrastructure, not an operator. */
const NON_BRAND_LABELS = new Set(['www', 'localhost', 'agent', 'agents', 'app', 'api']);

/**
 * `brand.localhost:3005` → `brand`, `brand.agents.example.com` → `brand`,
 * `localhost:3005` / `127.0.0.1` / `example.com` → `NEXT_PUBLIC_DEFAULT_SUBDOMAIN`.
 */
export const getSubdomainFromHost = (host: string | null | undefined): string => {
  if (!host) return DEFAULT_SUBDOMAIN;
  const hostname = host.split(':')[0].toLowerCase();
  if (
    hostname === 'localhost' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
    hostname === '[::1]'
  ) {
    return DEFAULT_SUBDOMAIN;
  }
  const parts = hostname.split('.');
  if (parts.length < 2) return DEFAULT_SUBDOMAIN;
  // A bare apex (example.com) has no subdomain; `brand.localhost` does.
  if (parts.length === 2 && parts[1] !== 'localhost') return DEFAULT_SUBDOMAIN;
  const label = parts[0];
  return NON_BRAND_LABELS.has(label) ? DEFAULT_SUBDOMAIN : label;
};

/** Browser-side: the proxy's cookie first, else parse `window.location`. */
export const readClientSubdomain = (): string => {
  if (typeof document === 'undefined') return DEFAULT_SUBDOMAIN;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TENANT_COOKIE}=([^;]*)`));
  if (match?.[1]) return decodeURIComponent(match[1]);
  return getSubdomainFromHost(window.location.host);
};
