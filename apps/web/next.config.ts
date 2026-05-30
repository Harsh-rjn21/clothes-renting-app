import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const isDocker = process.env.DOCKER_ENV === "true";
    return [
      {
        source: '/api/auth/:path*',
        destination: isDocker ? 'http://backend:8000/auth/:path*' : 'http://127.0.0.1:8000/auth/:path*',
      },
      {
        source: '/api/catalog/:path*',
        destination: isDocker ? 'http://backend:8000/catalog/:path*' : 'http://127.0.0.1:8000/catalog/:path*',
      },
      {
        source: '/api/rental/:path*',
        destination: isDocker ? 'http://backend:8000/rental/:path*' : 'http://127.0.0.1:8000/rental/:path*',
      },
      {
        source: '/api/feedback/:path*',
        destination: isDocker ? 'http://backend:8000/feedback/:path*' : 'http://127.0.0.1:8000/feedback/:path*',
      }
    ];
  },
};

export default nextConfig;
