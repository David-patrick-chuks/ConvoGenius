import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Define a type for context params
type ProxyContext = {
  params: { path: string[] } | Promise<{ path: string[] }>;
};

// Helper to unwrap ctx.params
async function extractParams(ctx: ProxyContext): Promise<{ path: string[] }> {
  return "then" in ctx.params ? await ctx.params : ctx.params;
}

export async function GET(req: NextRequest, ctx: ProxyContext) {
  const { path } = await extractParams(ctx);
  return handleProxy(req, path);
}

export async function POST(req: NextRequest, ctx: ProxyContext) {
  const { path } = await extractParams(ctx);
  return handleProxy(req, path);
}

export async function PUT(req: NextRequest, ctx: ProxyContext) {
  const { path } = await extractParams(ctx);
  return handleProxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: ProxyContext) {
  const { path } = await extractParams(ctx);
  return handleProxy(req, path);
}

async function handleProxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const joined = Array.isArray(pathSegments) ? pathSegments.join("/") : "";
  const targetUrl = `${backendBase}/${joined}${req.nextUrl.search}`;

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();

  const headers = new Headers(req.headers);
  const cookie = headers.get("cookie") || "";

  const forwardHeaders: Record<string, string> = {};
  headers.forEach((v, k) => {
    if (["host", "connection", "content-length"].includes(k.toLowerCase())) return;
    forwardHeaders[k] = v;
  });
  forwardHeaders["cookie"] = cookie;

  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers: forwardHeaders,
    body: body ? Buffer.from(body) : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers();
  backendRes.headers.forEach((v, k) => {
    if (k.toLowerCase() !== "set-cookie") resHeaders.set(k, v);
  });

  // `getSetCookie()` isn’t in the standard type — handle it safely and bind to headers to avoid illegal invocation
  const rawHeaders = backendRes.headers as unknown as { getSetCookie?: () => string[] };
  const boundGetSetCookie = typeof rawHeaders.getSetCookie === 'function' ? rawHeaders.getSetCookie.bind(backendRes.headers) : undefined;
  const setCookies = typeof boundGetSetCookie === 'function' ? boundGetSetCookie() : [];
  for (const c of setCookies) resHeaders.append("set-cookie", c);

  const contentType = backendRes.headers.get("content-type") || "";
  const status = backendRes.status;

  if (contentType.includes("application/json")) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status, headers: resHeaders });
  }

  const buf = Buffer.from(await backendRes.arrayBuffer());
  return new NextResponse(buf, { status, headers: resHeaders });
}
