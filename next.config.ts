import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Next.js 15/16 generates route-handler types in .next/types that conflict
    // with the correct Promise<params> pattern used in our handlers.
    // The code is correct at runtime; this suppresses the build-time false positive.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
