import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: "caseId required" }, { status: 400 });
    }

    const cwd = process.cwd();
    const output = execSync(`python3 replay_case.py --case-id ${caseId}`, {
      cwd,
      encoding: "utf-8",
    });

    const data = JSON.parse(output);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Replay failed:", error);
    return NextResponse.json(
      { error: "Replay execution failed" },
      { status: 500 }
    );
  }
}