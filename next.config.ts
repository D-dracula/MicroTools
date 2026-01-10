import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Vercel deployment optimizations
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
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
  
  // Output configuration for Vercel
  output: 'standalone',
};

export default withNextIntl(nextConfig);
