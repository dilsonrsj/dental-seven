"use client";

import Image from "next/image";
import {
  useDentistFilter,
  type SelectedDentistId,
} from "@/contexts/dentist-filter-context";
import { useClinicSession } from "@/contexts/clinic-session-context";
import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { SignOutButton } from "./sign-out-button";

export function AppHeader() {
  const { selectedDentistId, setSelectedDentistId } = useDentistFilter();
  const { clinic, dentists, profile } = useClinicSession();

  const loggedInName =
    (profile.dentist_id
      ? dentists.find((dentist) => dentist.id === profile.dentist_id)?.name
      : null) ??
    profile.full_name?.trim() ??
    null;

  const options: { id: SelectedDentistId; label: string }[] = [
    { id: "all", label: "Todos" },
    ...dentists.map((d) => ({
      id: d.id,
      label: d.name.split(" ")[0] ?? d.name,
    })),
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {clinic?.logo_preview_url ? (
          <Image
            src={clinic.logo_preview_url}
            alt={clinic.name}
            width={120}
            height={36}
            unoptimized
            className="h-9 w-auto max-w-[120px] shrink-0 object-contain"
          />
        ) : (
          <DentalSevenLogo
            variant="mark"
            surface="transparent"
            height={36}
            href="/agenda"
          />
        )}
        <div className="min-w-0">
          <h1 className="truncate font-display text-sm font-semibold tracking-tight sm:text-lg">
            {clinic?.name ?? "Dental Seven"}
          </h1>
          {loggedInName && (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {loggedInName}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {options.length > 1 && (
          <label className="flex items-center gap-2">
            <span className="sr-only">Filtrar por dentista</span>
            <select
              value={selectedDentistId}
              onChange={(event) =>
                setSelectedDentistId(event.target.value as SelectedDentistId)
              }
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {options.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <SignOutButton compact className="h-10 w-10 px-0 sm:w-auto sm:px-4" />
      </div>
    </header>
  );
}
