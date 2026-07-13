/**
 * When scheduling a new appointment, pre-fill convênio fields from the
 * patient's primary enrollment — only if that plan is still active in the clinic.
 */
export function resolvePatientInsuranceDefaults(
  patientId: string,
  primaryPlanByPatient: Record<string, string>,
  activePlanIds: readonly string[],
): {
  payment_source: "particular" | "insurance";
  insurance_plan_id: string;
} {
  const planId = primaryPlanByPatient[patientId];
  if (planId && activePlanIds.includes(planId)) {
    return { payment_source: "insurance", insurance_plan_id: planId };
  }
  return { payment_source: "particular", insurance_plan_id: "" };
}

/** Garante um plan_id válido ao usar convênio (evita "" no Postgres uuid). */
export function resolveInsurancePlanSelection(
  currentPlanId: string,
  activePlanIds: readonly string[],
): string {
  if (currentPlanId && activePlanIds.includes(currentPlanId)) {
    return currentPlanId;
  }
  return activePlanIds[0] ?? "";
}
