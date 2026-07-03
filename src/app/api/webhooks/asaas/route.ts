import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AsaasWebhookBody = {
  event?: string;
  payment?: { subscription?: string; customer?: string };
  [key: string]: unknown;
};

async function resolveClinicId(
  admin: ReturnType<typeof createAdminClient>,
  body: AsaasWebhookBody,
): Promise<string | null> {
  const subscriptionId = body.payment?.subscription;
  if (subscriptionId) {
    const { data } = await admin
      .from("clinics")
      .select("id")
      .eq("asaas_subscription_id", subscriptionId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const customerId = body.payment?.customer;
  if (customerId) {
    const { data } = await admin
      .from("clinics")
      .select("id")
      .eq("asaas_customer_id", customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

export async function POST(request: Request) {
  const token = request.headers.get("asaas-access-token");
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AsaasWebhookBody;
  const admin = createAdminClient();
  const clinicId = await resolveClinicId(admin, body);

  const { error: persistError } = await admin.from("asaas_webhook_events").insert({
    event_type: body.event ?? "UNKNOWN",
    clinic_id: clinicId,
    payload: body,
  });

  if (persistError) {
    console.error("asaas webhook persist failed:", persistError.message);
    return NextResponse.json({ error: "Failed to persist webhook" }, { status: 500 });
  }

  const event = body.event;
  const subscriptionId = body.payment?.subscription;

  if (!subscriptionId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

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
