import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: false,

  // Local tenants are browsed as http://<subdomain>.localhost:3005 (or <subdomain>.lvh.me). The dev
  // server 403s cross-origin /_next/* requests unless those hosts are listed here.
  allowedDevOrigins: ['*.localhost', 'lvh.me', '*.lvh.me'],

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Without a backend URL the destination would be the literal "undefined/api/:path*", which Next rejects.
    if (!apiUrl) {
      console.warn(
        '[next.config] NEXT_PUBLIC_API_URL is not set — skipping the /api proxy rewrite. ' +
          'Copy .env.example to .env.local and set it.',
      );
      return [];
    }
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
