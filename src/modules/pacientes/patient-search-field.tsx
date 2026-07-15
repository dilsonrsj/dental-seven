"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import type { Patient } from "@/lib/supabase/types";
import { searchPatientsLite } from "./actions";

type PatientSearchFieldProps = {
  initialSearch?: string;
};

export function PatientSearchField({
  initialSearch = "",
}: PatientSearchFieldProps) {
  const listId = useId();
  const router = useRouter();
  const [term, setTerm] = useState(initialSearch);
  const [matches, setMatches] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 1) {
      setMatches([]);
      setOpen(false);
      return;
    }

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const rows = await searchPatientsLite(q, 8);
          setMatches(rows);
          setOpen(true);
        } catch {
          setMatches([]);
        }
      });
    }, 200);

    return () => window.clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex flex-1 gap-2">
      <div className="relative min-w-0 flex-1">
        <Input
          name="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => {
            if (matches.length > 0) setOpen(true);
          }}
          placeholder="Buscar paciente"
          aria-label="Buscar paciente"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {open && matches.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-64 overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            {matches.map((patient) => (
              <li key={patient.id} role="option" aria-selected={false}>
                <Link
                  href={`/pacientes/${patient.id}`}
                  className="block px-3 py-2 text-sm hover:bg-primary/10"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-medium text-foreground">
                    {patient.name}
                  </span>
                  {(patient.phone || patient.whatsapp) && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {patient.phone ?? patient.whatsapp}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {open && !pending && term.trim().length > 0 && matches.length === 0 ? (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground shadow-lg">
            Nenhum paciente encontrado.
          </div>
        ) : null}
      </div>
      <Button
        type="button"
        onClick={() => {
          const q = term.trim();
          router.push(q ? `/pacientes?search=${encodeURIComponent(q)}` : "/pacientes");
          setOpen(false);
        }}
      >
        Buscar
      </Button>
    </div>
  );
}
