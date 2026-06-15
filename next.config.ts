import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Marketing imagery is served from the Unsplash CDN.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
