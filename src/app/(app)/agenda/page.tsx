import {
  getAppointments,
  getDentists,
  getPatients,
  isSupabaseConfigured,
} from "@/modules/agenda/actions";
import { AgendaPageClient } from "@/modules/agenda/agenda-page-client";
import { getWeekDays } from "@/modules/agenda/date-utils";

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

  if (!(await isSupabaseConfigured())) {
    return (
      <AgendaPageClient
        appointments={[]}
        dentists={[]}
        patients={[]}
        configureMessage="Configure .env.local"
        initialPatientId={initialPatientId}
      />
    );
  }

  const today = startOfTodayUtc();
  const weekDays = getWeekDays(today);
  const from = weekDays[0].toISOString();
  const to = endOfDayUtc(weekDays[6]).toISOString();
  const [appointments, dentists, patients] = await Promise.all([
    getAppointments(from, to),
    getDentists(),
    getPatients(),
  ]);

  return (
    <AgendaPageClient
      appointments={appointments}
      dentists={dentists}
      patients={patients}
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
