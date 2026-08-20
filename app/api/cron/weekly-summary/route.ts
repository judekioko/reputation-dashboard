import { NextResponse } from "next/server";
import { sendWeeklySummaries } from "@/lib/alerts";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendWeeklySummaries();
  return NextResponse.json({ ok: true });
}
