import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";
const BACKEND_UNAVAILABLE_MESSAGE =
  "Astraea backend is unavailable. Start the FastAPI server on http://localhost:8000 or set API_BASE_URL.";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/api/evaluation/latest`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Evaluation artifact unavailable" }));
      return NextResponse.json(
        { error: error.error || error.detail || "Evaluation artifact unavailable" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: BACKEND_UNAVAILABLE_MESSAGE, details: String(error) },
      { status: 503 }
    );
  }
}
