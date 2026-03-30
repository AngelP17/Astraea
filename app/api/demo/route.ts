import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function POST() {
  try {
    const response = await fetch(`${API_BASE}/api/demo`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Demo pipeline execution failed" }));
      return NextResponse.json(
        { error: error.error || "Demo pipeline execution failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Demo pipeline failed:", error);
    return NextResponse.json(
      { error: "Demo pipeline execution failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/api/demo/stream`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: "Failed to connect to streaming endpoint" },
        { status: response.status || 502 }
      );
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Streaming demo failed:", error);
    return NextResponse.json(
      { error: "Failed to connect to streaming endpoint", details: String(error) },
      { status: 500 }
    );
  }
}
