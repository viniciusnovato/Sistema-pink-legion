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
