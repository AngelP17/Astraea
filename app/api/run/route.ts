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

export async function POST() {
  try {
    const response = await fetch(`${API_BASE}/api/run`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Pipeline execution failed" }));
      return NextResponse.json(
        { error: error.error || "Pipeline execution failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pipeline run failed:", error);
    return NextResponse.json(
      { error: BACKEND_UNAVAILABLE_MESSAGE, details: String(error) },
      { status: 503 }
    );
  }
}
