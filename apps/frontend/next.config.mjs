import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // API proxy configuration for backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },

  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Add production image domains via NEXT_PUBLIC_IMAGE_DOMAINS env var
      // e.g., NEXT_PUBLIC_IMAGE_DOMAINS=cdn.example.com,images.example.com
      ...(process.env.NEXT_PUBLIC_IMAGE_DOMAINS || '')
        .split(',')
        .filter(Boolean)
        .map((hostname) => ({
          protocol: 'https',
          hostname: hostname.trim(),
        })),
    ],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Turbopack configuration (empty config to silence webpack vs turbopack warning)
  // next-pwa uses webpack internally, this silences the warning while keeping compatibility
  turbopack: {},
};

export default pwaConfig(nextConfig);
