import { NextResponse } from "next/server";
import { processTrialEmails } from "@/lib/email/trial-reminders";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processTrialEmails();
  return NextResponse.json({ ok: true, ...result });
}
