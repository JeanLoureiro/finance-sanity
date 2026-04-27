import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@tanstack/react-query'],
  },
  compress: true,
};

export default nextConfig;
