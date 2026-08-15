import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl() {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const target = `${getBackendBaseUrl()}${pathname}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "host" && lower !== "connection") {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("transfer-encoding");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Failed to proxy ${target}`, error);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export const config = {
  matcher: ["/api/v1/:path*", "/uploads/:path*"],
};
