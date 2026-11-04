import { NextResponse, type NextRequest } from 'next/server';
import { getSubdomainFromHost, TENANT_COOKIE, TENANT_HEADER } from '@/lib/tenant';

/**
 * Tenant resolution (Next 16 "proxy", formerly middleware). Reads the operator subdomain from the Host
 * header — `brand.localhost:3005` / `brand.<domain>` → `brand`, plain localhost → NEXT_PUBLIC_DEFAULT_SUBDOMAIN —
 * forwards it to server code as `x-tenant-subdomain` and stores it in the `agent_tenant` cookie, which
 * TenantManagerLayout reads to call `GET /api/operator/resolve/:subdomain`.
 */
export function proxy(request: NextRequest) {
  const subdomain = getSubdomainFromHost(request.headers.get('host'));

  const requestHeaders = new Headers(request.headers);
  if (subdomain) requestHeaders.set(TENANT_HEADER, subdomain);
  else requestHeaders.delete(TENANT_HEADER);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (request.cookies.get(TENANT_COOKIE)?.value !== subdomain) {
    if (subdomain) {
      response.cookies.set(TENANT_COOKIE, subdomain, { path: '/', sameSite: 'lax' });
    } else {
      response.cookies.delete(TENANT_COOKIE);
    }
  }
  return response;
}

export const config = {
  // Pages only: skip the API rewrite, Next internals and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)'],
};
