import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const isDocker = process.env.DOCKER_ENV === "true";
    const backendUrl = process.env.BACKEND_URL || (isDocker ? 'http://backend:8000' : 'http://127.0.0.1:8000');
    return [
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/api/catalog/:path*',
        destination: `${backendUrl}/catalog/:path*`,
      },
      {
        source: '/api/rental/:path*',
        destination: `${backendUrl}/rental/:path*`,
      },
      {
        source: '/api/feedback/:path*',
        destination: `${backendUrl}/feedback/:path*`,
      }
    ];
  },
};

export default nextConfig;
