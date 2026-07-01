import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const token = request.headers.get("asaas-access-token");
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    event?: string;
    payment?: { subscription?: string; customer?: string };
  };

  const event = body.event;
  const subscriptionId = body.payment?.subscription;

  if (!subscriptionId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const admin = createAdminClient();
  let status: string | null = null;

  if (event === "PAYMENT_CONFIRMED") status = "active";
  if (event === "PAYMENT_OVERDUE") status = "past_due";
  if (event === "SUBSCRIPTION_DELETED") status = "canceled";

  if (status) {
    await admin
      .from("clinics")
      .update({ subscription_status: status })
      .eq("asaas_subscription_id", subscriptionId);
  }

  return NextResponse.json({ ok: true });
}
