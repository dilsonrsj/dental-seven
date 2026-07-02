import {
  getAppointments,
  getDentists,
  getPatients,
} from "@/modules/agenda/actions";
import { AgendaPageClient } from "@/modules/agenda/agenda-page-client";
import { getWeekDays } from "@/modules/agenda/date-utils";
import { getAuthContext } from "@/lib/auth/context";
import { listProcedures } from "@/modules/procedimentos/actions";

type AgendaPageProps = {
  searchParams?: Promise<{
    patientId?: string | string[];
  }>;
};

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = await searchParams;
  const initialPatientId = Array.isArray(params?.patientId)
    ? params?.patientId[0]
    : params?.patientId;

  const ctx = await getAuthContext();
  const hasProcedimentosModule =
    ctx?.enabledModules.includes("procedimentos") ?? false;

  const today = startOfTodayUtc();
  const weekDays = getWeekDays(today);
  const from = weekDays[0].toISOString();
  const to = endOfDayUtc(weekDays[6]).toISOString();
  const [appointments, dentists, patients, catalogProcedures] =
    await Promise.all([
      getAppointments(from, to),
      getDentists(),
      getPatients(),
      hasProcedimentosModule
        ? listProcedures({ activeOnly: true })
        : Promise.resolve([]),
    ]);

  return (
    <AgendaPageClient
      appointments={appointments}
      dentists={dentists}
      patients={patients}
      catalogProcedures={catalogProcedures}
      initialPatientId={initialPatientId}
    />
  );
}

function startOfTodayUtc() {
  const today = new Date();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 8),
  );
}

function endOfDayUtc(date: Date) {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}
