import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/api/cases`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      const error = await response.json().catch(() => ({ error: "Failed to fetch cases" }));
      return NextResponse.json(
        { error: error.error || "Failed to fetch cases" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases", details: String(error) },
      { status: 500 }
    );
  }
}
