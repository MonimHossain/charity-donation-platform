import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function minioObjectUrl(objectPath: string): string {
  const host = process.env.MINIO_ENDPOINT || "localhost";
  const port = process.env.MINIO_PORT || "9002";
  const bucket =
    process.env.MINIO_BUCKET_MEDIA || process.env.MINIO_BUCKET_NAME || "charity-media";
  const encoded = objectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `http://${host}:${port}/${bucket}/${encoded}`;
}

const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
  "cache-control",
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const objectPath = path.join("/");
  if (!objectPath) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const upstreamUrl = minioObjectUrl(objectPath);
  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { headers, cache: "no-store" });
  } catch {
    return NextResponse.json({ message: "Media unavailable" }, { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse(upstream.body, { status: upstream.status });
  }

  const responseHeaders = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
