import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@tanstack/react-query', 'date-fns'],
  },
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
