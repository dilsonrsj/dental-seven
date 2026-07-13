"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateFounderFeedbackStatus } from "@/lib/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { foundingStageLabel } from "@/modules/admin/founding-pipeline";
import type {
  FounderAdminRow,
  FounderFeedbackStatus,
} from "@/modules/admin/types";

type FoundingListProps = {
  founders: FounderAdminRow[];
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function feedbackLabel(status: FounderAdminRow["feedback_status"]): string {
  if (status === "sent") return "Enviado";
  if (status === "follow_up") return "Follow-up";
  return "Pendente";
}

function feedbackClass(status: FounderAdminRow["feedback_status"]): string {
  if (status === "sent") return "border-primary/30 text-primary";
  if (status === "follow_up") return "border-amber-500/40 text-amber-600";
  return "border-muted-foreground/30 text-muted-foreground";
}

function stageClass(stage: FounderAdminRow["stage"]): string {
  if (stage === "active") return "border-primary/30 text-primary";
  if (stage === "signed_up") return "border-emerald-500/40 text-emerald-600";
  if (stage === "accessed") return "border-amber-500/40 text-amber-600";
  return "border-muted-foreground/30 text-muted-foreground";
}

function FounderFeedbackCell({
  founderId,
  status,
}: {
  founderId: string;
  status: FounderFeedbackStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleUpdate(next: FounderFeedbackStatus) {
    if (next === status) return;

    setError("");
    startTransition(async () => {
      try {
        await updateFounderFeedbackStatus(founderId, next);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível atualizar.",
        );
      }
    });
  }

  return (
    <div className="space-y-2">
      <Badge className={feedbackClass(status)}>{feedbackLabel(status)}</Badge>
      <div className="flex flex-wrap gap-1">
        {status !== "sent" ? (
          <Button
            type="button"
            variant="outline"
            className="h-8 px-2 text-xs normal-case tracking-normal font-medium"
            disabled={pending}
            onClick={() => handleUpdate("sent")}
          >
            Enviado
          </Button>
        ) : null}
        {status !== "follow_up" ? (
          <Button
            type="button"
            variant="outline"
            className="h-8 px-2 text-xs normal-case tracking-normal font-medium"
            disabled={pending}
            onClick={() => handleUpdate("follow_up")}
          >
            Follow-up
          </Button>
        ) : null}
        {status !== "pending" ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs normal-case tracking-normal font-medium"
            disabled={pending}
            onClick={() => handleUpdate("pending")}
          >
            Pendente
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CopyReferralButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void handleCopy()}>
      {copied ? "Copiado" : "Copiar link"}
    </Button>
  );
}

export function FoundingList({ founders }: FoundingListProps) {
  if (founders.length === 0) {
    return (
      <Card>
        <CardContent className="py-5 text-sm text-muted-foreground">
          Nenhum founding member cadastrado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="ds-table-shell">
      <table className="ds-table min-w-[72rem]">
        <thead className="bg-surface text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Dentista</th>
            <th className="px-4 py-3 font-medium">Clínica</th>
            <th className="px-4 py-3 font-medium">Estágio</th>
            <th className="px-4 py-3 font-medium">Indicado por</th>
            <th className="px-4 py-3 font-medium">Indicações</th>
            <th className="px-4 py-3 font-medium">Feedback</th>
            <th className="px-4 py-3 font-medium">Criado em</th>
            <th className="px-4 py-3 font-medium">Link pessoal</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {founders.map((founder) => (
            <tr key={founder.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="font-medium">{founder.full_name}</div>
                <div className="text-xs text-muted-foreground">{founder.email}</div>
              </td>
              <td className="px-4 py-3">
                <div>{founder.clinic_name}</div>
                <div className="text-xs text-muted-foreground">
                  {founder.city}/{founder.state}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge className={stageClass(founder.stage)}>
                  {foundingStageLabel(founder.stage)}
                </Badge>
              </td>
              <td className="px-4 py-3">{founder.invite_ref ?? "—"}</td>
              <td className="px-4 py-3">{founder.referral_count}</td>
              <td className="px-4 py-3">
                <FounderFeedbackCell
                  founderId={founder.id}
                  status={founder.feedback_status}
                />
              </td>
              <td className="px-4 py-3">{formatDate(founder.created_at)}</td>
              <td className="px-4 py-3">
                <code className="text-xs text-muted-foreground">
                  {founder.ref_slug}
                </code>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  {founder.referral_url ? (
                    <CopyReferralButton url={founder.referral_url} />
                  ) : null}
                  {founder.clinic_id ? (
                    <Link
                      href={`/admin/clinicas/${founder.clinic_id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver clínica
                    </Link>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
