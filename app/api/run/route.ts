import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const cwd = process.cwd();
    execSync("python3 run_pipeline.py", { cwd, stdio: "pipe" });

    const resultsDir = path.join(cwd, "artifacts/results");
    const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json"));

    const latestFile = files.sort().pop();
    if (!latestFile) {
      return NextResponse.json({ error: "No results generated" }, { status: 500 });
    }

    const content = fs.readFileSync(path.join(resultsDir, latestFile), "utf-8");
    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Pipeline run failed:", error);
    return NextResponse.json(
      { error: "Pipeline execution failed" },
      { status: 500 }
    );
  }
}