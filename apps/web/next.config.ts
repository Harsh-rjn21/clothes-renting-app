import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://auth-service:8000/:path*',
      },
      {
        source: '/api/catalog/:path*',
        destination: 'http://catalog-service:8000/:path*', 
      },
      {
        source: '/api/rental/:path*',
        destination: 'http://rental-service:8000/:path*', 
      },
      {
        source: '/api/feedback/:path*',
        destination: 'http://feedback-service:8000/:path*',
      }
    ];
  },
};

export default nextConfig;
