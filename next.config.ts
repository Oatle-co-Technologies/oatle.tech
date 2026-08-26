import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The FastAPI backend (mounted at /api/backend/* via vercel.json rewrites)
  // defines its collection routes WITH trailing slashes (e.g. /clients/,
  // /leads/, /projects/, /tasks/, /staff/, /invoices/) and the dashboard
  // frontend calls them that way. By default Next.js issues a 308 redirect
  // that strips trailing slashes BEFORE vercel.json rewrites are evaluated,
  // which caused /api/backend/clients/ -> /api/backend/clients -> FastAPI
  // redirect_slashes 307 -> /clients/?path=clients -> Vercel 404.
  // Disabling the automatic trailing-slash redirect lets the original URL
  // reach the /api/index serverless function intact.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;