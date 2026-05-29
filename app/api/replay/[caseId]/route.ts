import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";
const BACKEND_UNAVAILABLE_MESSAGE =
  "Astraea backend is unavailable. Start the FastAPI server on http://localhost:8000 or set API_BASE_URL.";

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function POST(
  request: Request,
  { params }: { params: { caseId: string } | Promise<{ caseId: string }> }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const caseId = resolvedParams.caseId;

    if (!caseId) {
      return NextResponse.json({ error: "caseId parameter is required" }, { status: 400 });
    }

    const response = await fetch(`${API_BASE}/api/replay/${caseId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Case not found for replay: ${caseId}` },
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({ error: "Replay failed" }));
      return NextResponse.json(
        { error: error.error || "Replay failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dynamic case replay failed:", error);
    return NextResponse.json(
      { error: BACKEND_UNAVAILABLE_MESSAGE, details: String(error) },
      { status: 503 }
    );
  }
}
