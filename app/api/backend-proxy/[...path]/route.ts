import { auth } from "@/lib/auth/server";

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
  const tokenResult = await auth.token();
  const token = tokenResult.data?.token;

  if (!token) {
    return Response.json(
      {
        detail: "Authentication required",
      },
      {
        status: 401,
      }
    );
  }

  const { path } = await params;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  headers.set("authorization", `Bearer ${token}`);
  headers.set("x-oatle-backend-path", `/${path.join("/")}`);

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (accept) {
    headers.set("accept", accept);
  }

  const backendUrl = new URL("/api/index", request.url);
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
