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
    
    const replayDir = path.join(cwd, "artifacts/replays");
    const caseFile = path.join(replayDir, `${caseId}.json`);

    if (!fs.existsSync(caseFile)) {
      return NextResponse.json(
        { error: `Replay not found for case: ${caseId}` },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(caseFile, "utf-8");
    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Replay failed:", error);
    return NextResponse.json(
      { error: "Replay execution failed", details: String(error) },
      { status: 500 }
    );
  }
}