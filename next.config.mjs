import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Security headers — applied to every response. CSP intentionally permissive at body level
// because we use inline styles in many places; tighten when migrating to nonce-based.
const SECURITY_HEADERS = [
  // Force HTTPS for 2 years incl. subdomains, eligible for HSTS preload
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disallow iframing the site (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit Referer leakage
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable powerful APIs we don't need
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  // Prevent stale content in browser cache for sensitive routes (cookies handled separately)
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Don't reveal X-Powered-By: Next.js
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'obpezocujzdaznrdgwoo.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'image.mux.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: { typedRoutes: true },
  async headers() {
    return [
      { source: '/(.*)', headers: SECURITY_HEADERS },
    ];
  },
};

export default withNextIntl(nextConfig);
