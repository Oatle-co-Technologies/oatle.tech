import type { NextConfig } from "next";

// NOTE: Do not enable skipTrailingSlashRedirect here. Vercel's rewrite
// engine cannot match "/api/backend/:path*" against URLs ending in a
// trailing slash, so trailing-slash API calls (/api/backend/clients/,
// /leads/, /projects/, ...) must rely on the platform's default 308
// normalization (which preserves method and body) to reach the
// api/index FastAPI wrapper in a matchable form. That wrapper snaps the
// stripped path onto FastAPI's registered routes, so no further
// redirect occurs afterwards.
const nextConfig: NextConfig = {};

export default nextConfig;