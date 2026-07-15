export type AppointmentInterval = {
  id?: string | null;
  dentist_id: string;
  starts_at: string;
  ends_at: string;
  status?: string | null;
};

export const SCHEDULE_CONFLICT_MESSAGE =
  "Já existe consulta neste horário para este dentista.";

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

/** Conflict if same dentist and intervals cross; ignores cancelled. */
export function findDentistScheduleConflict(
  candidate: AppointmentInterval,
  existing: AppointmentInterval[],
): AppointmentInterval | null {
  if (candidate.status === "cancelled") return null;

  const start = new Date(candidate.starts_at);
  const end = new Date(candidate.ends_at);
  if (!(start.getTime() < end.getTime())) return null;

  for (const row of existing) {
    if (row.dentist_id !== candidate.dentist_id) continue;
    if (row.status === "cancelled") continue;
    if (candidate.id && row.id === candidate.id) continue;
    const otherStart = new Date(row.starts_at);
    const otherEnd = new Date(row.ends_at);
    if (intervalsOverlap(start, end, otherStart, otherEnd)) {
      return row;
    }
  }

  return null;
}

/**
 * Between overlapping non-cancelled rows for the same dentist, keep the
 * strongest status (completed > confirmed > pending), then earliest start;
 * return ids that should be cancelled to resolve the clash.
 */
export function pickOverlappingIdsToCancel(
  rows: AppointmentInterval[],
): string[] {
  const statusRank = (status?: string | null) => {
    if (status === "completed") return 3;
    if (status === "confirmed") return 2;
    if (status === "pending") return 1;
    return 0;
  };

  const active = rows.filter(
    (row) => row.status !== "cancelled" && row.id,
  ) as Array<AppointmentInterval & { id: string }>;

  const byDentist = new Map<string, typeof active>();
  for (const row of active) {
    const list = byDentist.get(row.dentist_id) ?? [];
    list.push(row);
    byDentist.set(row.dentist_id, list);
  }

  const toCancel = new Set<string>();

  for (const list of byDentist.values()) {
    const sorted = [...list].sort((a, b) => {
      const byStatus = statusRank(b.status) - statusRank(a.status);
      if (byStatus !== 0) return byStatus;
      const t =
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      if (t !== 0) return t;
      return a.id.localeCompare(b.id);
    });

    for (let i = 0; i < sorted.length; i++) {
      if (toCancel.has(sorted[i]!.id)) continue;
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        if (toCancel.has(b.id)) continue;
        if (
          intervalsOverlap(
            new Date(a.starts_at),
            new Date(a.ends_at),
            new Date(b.starts_at),
            new Date(b.ends_at),
          )
        ) {
          toCancel.add(b.id);
        }
      }
    }
  }

  return [...toCancel];
}
