import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const cwd = process.cwd();
    
    execSync("python3 run_demo_pipeline.py", { cwd, stdio: "pipe" });

    const resultsDir = path.join(cwd, "artifacts/demo_results");
    const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      return NextResponse.json({ error: "No demo results generated" }, { status: 500 });
    }

    const results = files.map((file) => {
      const content = fs.readFileSync(path.join(resultsDir, file), "utf-8");
      return JSON.parse(content);
    }).sort((a, b) => a.case_id.localeCompare(b.case_id));

    return NextResponse.json({
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Demo pipeline failed:", error);
    return NextResponse.json(
      { error: "Demo pipeline execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
