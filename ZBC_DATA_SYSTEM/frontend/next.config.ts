import type { NextConfig } from "next";

const backendBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

const nextConfig: NextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBaseUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendBaseUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
