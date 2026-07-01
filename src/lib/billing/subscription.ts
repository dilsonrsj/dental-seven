export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "expired"
  | "canceled";

export function shouldShowPaywall(
  status: SubscriptionStatus,
  role: string,
): boolean {
  if (role === "super_admin") return false;
  return status === "expired" || status === "past_due";
}

export function isSubscriptionBlocking(
  status: SubscriptionStatus,
  role: string,
): boolean {
  if (role === "super_admin") return false;
  if (status === "active" || status === "trialing") return false;
  if (status === "expired" || status === "past_due") return true;
  return status === "canceled";
}

export function trialEndsAtFromNow(days = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
