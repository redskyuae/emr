import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The PDF exports read their fonts from disk, which the server trace cannot see on its own.
  outputFileTracingIncludes: {
    '/api/v1/audit-log/**': ['./app/api/lib/export/fonts/*.ttf'],
  },
  images: {
    // Marketing imagery is served from the Unsplash CDN.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
