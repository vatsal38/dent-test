import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // 120B — legacy / mistyped student correction URLs → live form
      {
        source: "/app/bob/correction",
        destination: "/app/bob/attendance/correction",
        permanent: false,
      },
      {
        source: "/app/bob/absence-correction",
        destination: "/app/bob/attendance/correction",
        permanent: false,
      },
      {
        source: "/app/bob/attendance-correction",
        destination: "/app/bob/attendance/correction",
        permanent: false,
      },
      {
        source: "/app/bob/forms/attendance-correction",
        destination: "/app/bob/attendance/correction",
        permanent: false,
      },
      {
        source: "/app/bob/submit/attendance-correction",
        destination: "/app/bob/attendance/correction",
        permanent: false,
      },
      {
        source: "/app/bob/submit/correction",
        destination: "/app/bob/attendance/correction",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
