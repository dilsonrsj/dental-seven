import { PLAN_LABELS, PLAN_PRICES, type PlanKey } from "./plans";

const SANDBOX_URL = "https://sandbox.asaas.com/api/v3";
const PRODUCTION_URL = "https://api.asaas.com/api/v3";

function getBaseUrl(): string {
  return process.env.ASAAS_ENV === "production" ? PRODUCTION_URL : SANDBOX_URL;
}

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY?.trim());
}

type AsaasCustomer = { id: string };
type AsaasSubscription = { id: string };

async function asaasFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const apiKey = process.env.ASAAS_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asaas ${path}: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

export async function createAsaasCustomer(input: {
  clinicId: string;
  clinicName: string;
  email: string;
}): Promise<string | null> {
  const result = await asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.clinicName,
      email: input.email,
      externalReference: input.clinicId,
      notificationDisabled: false,
    }),
  });
  return result?.id ?? null;
}

export async function createAsaasSubscription(input: {
  customerId: string;
  planKey: PlanKey;
  firstDueDate: string;
}): Promise<string | null> {
  const dueDate = input.firstDueDate.slice(0, 10);
  const result = await asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: PLAN_PRICES[input.planKey],
      nextDueDate: dueDate,
      cycle: "MONTHLY",
      description: `Dental Seven — ${PLAN_LABELS[input.planKey]}`,
    }),
  });
  return result?.id ?? null;
}
