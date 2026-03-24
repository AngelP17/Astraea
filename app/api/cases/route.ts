import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "artifacts/results");

  if (!fs.existsSync(dir)) {
    return NextResponse.json([]);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  const data = files
    .map((file) => {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      return JSON.parse(content);
    })
    .sort((a, b) => (a.event_id > b.event_id ? 1 : -1));

  return NextResponse.json(data);
}