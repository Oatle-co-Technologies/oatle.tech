import type { NextRequest } from "next/server";
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase") return Response.json({ detail: "Not found" }, { status: 404 });
  const { auth } = await import("@/lib/auth/server");
  const handlers = auth.handler();
  return request.method === "GET" ? handlers.GET(request, context) : handlers.POST(request, context);
}
export const GET = handle;
export const POST = handle;
