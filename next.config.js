/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com",
      "script-src 'self'",
      "script-src-elem 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
      "script-src-attr 'none'",
      "style-src 'self' https://fonts.googleapis.com",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src-attr 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join('; ');
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(), payment=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    ];

    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
    ],
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    // Handle .riv files for Rive animations
    config.module.rules.push({
      test: /\.riv$/,
      type: 'asset/resource',
    });
    return config;
  },
};

module.exports = nextConfig;
