import type { SubscriptionStatus } from "@/lib/billing/subscription";
import { trialEndsAtFromNow } from "@/lib/billing/subscription";

export type SignupAccessPeriod = {
  subscriptionStatus: SubscriptionStatus;
  accessEndsAt: string;
  skipAsaas: boolean;
};

/** Beta: access until official beta end date, no 7-day trial / Asaas. */
export function resolveSignupAccessPeriod(
  betaGateEnabled: boolean,
  betaEndsAtDate: string,
): SignupAccessPeriod {
  if (betaGateEnabled) {
    return {
      subscriptionStatus: "active",
      accessEndsAt: `${betaEndsAtDate}T23:59:59.000Z`,
      skipAsaas: true,
    };
  }

  return {
    subscriptionStatus: "trialing",
    accessEndsAt: trialEndsAtFromNow(7),
    skipAsaas: false,
  };
}
