import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel optimizations
  serverExternalPackages: ['puppeteer'],
  
  // Image configuration for Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bzkgjtxrzwzoibzesphi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Otimizações de performance
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache por 60 segundos
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Output file tracing root
  outputFileTracingRoot: __dirname,
  
  // Security headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // ESLint configuration for build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration for build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
