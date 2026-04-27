import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and mammoth use Node.js native modules — keep them server-side only
  serverExternalPackages: ["pdf-parse", "mammoth"],
  // Hide the Next.js dev toolbar badge (the "N" logo in the corner)
  devIndicators: false,
};

export default nextConfig;
