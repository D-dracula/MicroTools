import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/micro_tools',
  },
  
  // Vercel deployment optimizations
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Static file serving
  async headers() {
    return [
      {
        source: '/test-data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirect trailing slashes
  trailingSlash: false,
  
  // Output configuration for Vercel - remove standalone to prevent multiple builds
  // output: 'standalone',
};

export default withNextIntl(nextConfig);
