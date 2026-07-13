"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BetaFeedbackAdminRow } from "@/modules/admin/types";

const MODULE_LABEL: Record<BetaFeedbackAdminRow["top_module"], string> = {
  agenda: "Agenda",
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  outro: "Outro",
};

const WOULD_USE_LABEL: Record<BetaFeedbackAdminRow["would_use_today"], string> =
  {
    yes: "Sim",
    maybe: "Talvez",
    no: "Não",
  };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function truncate(value: string, max = 80): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

type Props = {
  rows: BetaFeedbackAdminRow[];
};

export function BetaFeedbackList({ rows }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhum feedback estruturado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const open = expandedId === row.id;
        return (
          <Card key={row.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {row.clinic_name ?? "Clínica"} · {row.author_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(row.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-primary/30 text-primary">
                    NPS {row.nps}
                  </Badge>
                  <Badge className="border-border text-muted-foreground">
                    {MODULE_LABEL[row.top_module]}
                  </Badge>
                  <Badge className="border-border text-muted-foreground">
                    Usaria: {WOULD_USE_LABEL[row.would_use_today]}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Gostou: </span>
                {open ? row.liked_most : truncate(row.liked_most)}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Travou: </span>
                {open ? row.blocked_or_missing : truncate(row.blocked_or_missing)}
              </p>
              {open && row.notes ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Notas: </span>
                  {row.notes}
                </p>
              ) : null}
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setExpandedId(open ? null : row.id)}
              >
                {open ? "Recolher" : "Ver completo"}
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
