import type {
  AdminActionItem,
  AdminActionKind,
  AdminClinicMetricsInput,
  FairUseAlertRow,
  FoundingSummary,
} from "./types";
import { trialsExpiringSoon } from "./dashboard-metrics";

export type ClinicAdoptionInput = AdminClinicMetricsInput & {
  patient_count: number;
  appointment_count: number;
};

export type FounderPendingInput = {
  id: string;
  full_name: string;
  clinic_name: string;
  created_at: string;
  signup_completed_at: string | null;
};

const ADOPTION_DAYS = 7;
const FOUNDER_PENDING_DAYS = 2;
const SUMMARY_DAYS = 7;

function daysAgo(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

export function isClinicWithoutAdoption(
  clinic: ClinicAdoptionInput,
  now: Date = new Date(),
): boolean {
  if (clinic.deleted_at) return false;
  const createdAt = new Date(clinic.created_at);
  if (createdAt > daysAgo(now, ADOPTION_DAYS)) return false;
  return clinic.patient_count === 0 || clinic.appointment_count === 0;
}

export function isFounderPendingSignup(
  founder: FounderPendingInput,
  now: Date = new Date(),
): boolean {
  if (founder.signup_completed_at) return false;
  const createdAt = new Date(founder.created_at);
  return createdAt <= daysAgo(now, FOUNDER_PENDING_DAYS);
}

function makeAction(
  id: string,
  kind: AdminActionKind,
  title: string,
  subtitle: string,
  href: string,
  sortDate: string,
): AdminActionItem {
  return { id, kind, title, subtitle, href, sortDate };
}

export function buildActionQueue(input: {
  clinics: AdminClinicMetricsInput[];
  adoptionClinics: ClinicAdoptionInput[];
  founders: FounderPendingInput[];
  fairUseAlerts: FairUseAlertRow[];
  now?: Date;
}): AdminActionItem[] {
  const now = input.now ?? new Date();
  const items: AdminActionItem[] = [];

  for (const clinic of input.clinics.filter(
    (row) => !row.deleted_at && row.subscription_status === "past_due",
  )) {
    items.push(
      makeAction(
        `past-due-${clinic.id}`,
        "past_due",
        clinic.name,
        "Pagamento em atraso",
        `/admin/clinicas/${clinic.id}`,
        clinic.trial_ends_at ?? clinic.created_at ?? now.toISOString(),
      ),
    );
  }

  for (const clinic of trialsExpiringSoon(input.clinics, 7, now)) {
    items.push(
      makeAction(
        `trial-${clinic.id}`,
        "trial_expiring",
        clinic.name,
        "Trial expira em breve",
        `/admin/clinicas/${clinic.id}`,
        clinic.trial_ends_at!,
      ),
    );
  }

  for (const founder of input.founders.filter((row) =>
    isFounderPendingSignup(row, now),
  )) {
    items.push(
      makeAction(
        `founder-${founder.id}`,
        "founder_pending_signup",
        founder.full_name,
        `${founder.clinic_name} — formulário sem cadastro`,
        "/admin/founding",
        founder.created_at,
      ),
    );
  }

  for (const clinic of input.adoptionClinics.filter((row) =>
    isClinicWithoutAdoption(row, now),
  )) {
    items.push(
      makeAction(
        `adoption-${clinic.id}`,
        "clinic_no_adoption",
        clinic.name,
        "Sem adoção — 0 pacientes ou 0 consultas",
        `/admin/clinicas/${clinic.id}`,
        clinic.created_at,
      ),
    );
  }

  for (const row of input.fairUseAlerts) {
    const maxPercent = Math.max(
      row.fairUse.whatsapp.percent ?? 0,
      row.fairUse.ai.percent ?? 0,
    );
    items.push(
      makeAction(
        `fair-use-${row.id}`,
        "fair_use_alert",
        row.name,
        `Fair use em ${Math.round(maxPercent)}%`,
        `/admin/clinicas/${row.id}`,
        now.toISOString(),
      ),
    );
  }

  return items.sort(
    (a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime(),
  );
}

export function clinicsCreatedSince(
  clinics: AdminClinicMetricsInput[],
  days = SUMMARY_DAYS,
  now: Date = new Date(),
): AdminClinicMetricsInput[] {
  const cutoff = daysAgo(now, days);
  return clinics.filter((clinic) => {
    if (clinic.deleted_at) return false;
    return new Date(clinic.created_at) >= cutoff;
  });
}

export function summarizeFounding(
  founders: Array<{
    created_at: string;
    invite_ref: string | null;
    signup_completed_at: string | null;
    clinic_id: string | null;
  }>,
  now: Date = new Date(),
): FoundingSummary {
  const cutoff = daysAgo(now, SUMMARY_DAYS);
  const recent = founders.filter(
    (founder) => new Date(founder.created_at) >= cutoff,
  );
  const converted = founders.filter((founder) => Boolean(founder.clinic_id));

  const refCounts = new Map<string, number>();
  for (const founder of founders) {
    const ref = founder.invite_ref?.trim();
    if (!ref) continue;
    refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1);
  }

  const topInviteRefs = [...refCounts.entries()]
    .map(([ref, count]) => ({ ref, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalFounders: founders.length,
    newFoundersLast7Days: recent.length,
    convertedCount: converted.length,
    conversionRate:
      founders.length === 0
        ? 0
        : Math.round((converted.length / founders.length) * 100),
    topInviteRefs,
  };
}
