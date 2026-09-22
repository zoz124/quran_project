import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // بيخلي Vercel يرفع الموقع حتى لو فيه أخطاء TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // بيخليه يتجاهل تحذيرات ESLint أثناء الـ Build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;