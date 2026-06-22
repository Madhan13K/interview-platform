import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to the Spring Boot backend at localhost:8080
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
      {
        source: "/oauth2/:path*",
        destination: "http://localhost:8080/oauth2/:path*",
      },
    ];
  },
};

export default nextConfig;
