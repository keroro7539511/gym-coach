import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from LAN IPs (phone / iPad on same WiFi).
  // Next.js 16 blocks cross-origin requests to dev resources by default,
  // which silently breaks server actions when accessed via non-localhost.
  // If your LAN IP differs, add it here; localhost is always allowed.
  allowedDevOrigins: ["192.168.50.117"],
};

export default nextConfig;
