import type { NextConfig } from "next";

/**
 * Backend to proxy to. Same default as app/lib/api.ts.
 * Override per-environment with BACKEND_URL (note: not NEXT_PUBLIC_ — this is server-side).
 */
const BACKEND_URL = (
  process.env.BACKEND_URL ?? "https://mutual-fund-backend-lc6h.onrender.com"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  /**
   * Proxy the API through this app's own origin.
   *
   * This exists to make CORS irrelevant. The browser only ever talks to the Vercel origin,
   * and Next forwards to the backend server-side, where CORS does not apply — so a new
   * deployment domain or preview URL can never break the app again.
   *
   * `app/lib/api.ts` sends requests to a relative path when NEXT_PUBLIC_API_URL is unset,
   * which is what routes them through here.
   */
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/health", destination: `${BACKEND_URL}/health` },
    ];
  },
};

export default nextConfig;
