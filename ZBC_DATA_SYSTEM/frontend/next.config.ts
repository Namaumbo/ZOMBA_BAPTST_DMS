import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:5000/api/v1/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
