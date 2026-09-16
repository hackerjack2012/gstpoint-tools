import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ backend: "unknown", detail: "NEXT_PUBLIC_API_URL not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/`, { method: "GET" });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      return NextResponse.json({ backend: "online", data });
    }
    return NextResponse.json({ backend: "offline", status: res.status }, { status: 502 });
  } catch (err) {
    return NextResponse.json({ backend: "offline", detail: String(err) }, { status: 502 });
  }
}
