import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyToBackend(
  request: Request,
  { params }: RouteContext
) {
  const { path } = await params;
  const backendPath = `/${path.join("/")}`;
  const isPublicDiscoveryBooking =
    backendPath === "/appointments/discovery";

  let token: string | undefined;
  if (!isPublicDiscoveryBooking) {
    if (process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase") {
      const client = await createClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (!error && user) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user.id === user.id) token = session.access_token;
      }
    } else {
      const { auth } = await import("@/lib/auth/server");
      const tokenResult = await auth.token();
      token = tokenResult.data?.token;
    }
  }

  if (!isPublicDiscoveryBooking && !token) {
    return Response.json(
      {
        detail: "Authentication required",
      },
      {
        status: 401,
      }
    );
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  headers.set("x-oatle-backend-path", backendPath);


  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (accept) {
    headers.set("accept", accept);
  }

  const backendUrl = process.env.NODE_ENV === "development" && process.env.BACKEND_INTERNAL_URL
    ? new URL(backendPath, process.env.BACKEND_INTERNAL_URL)
    : new URL("/api/index", request.url);
  backendUrl.search = new URL(request.url).search;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);

  // fetch() transparently decompresses the backend response. Do not forward
  // the original encoding or length metadata with the decoded response body.
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.set("cache-control", "private, no-store");
  responseHeaders.delete("transfer-encoding");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
