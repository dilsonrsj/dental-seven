"use client";

import { useState } from "react";
import { Button, toast } from "@/components/ui";
import {
  simulateConfirmAppointment,
  simulateReminder,
  simulateReschedule,
} from "./actions";

type DemoActionsProps = {
  threadId: string | null;
  onDone: () => Promise<void>;
};

const demoToastMessage = "Simulação — em produção via n8n";

export function DemoActions({ threadId, onDone }: DemoActionsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function runDemoAction(
    action: "confirm" | "reschedule" | "reminder",
    handler: (threadId: string) => Promise<unknown>,
  ) {
    if (!threadId) return;

    try {
      setPendingAction(action);
      await handler(threadId);
      await onDone();
      toast.success(demoToastMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
          Ações demo
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Estes botões simulam fluxos que serão automatizados via n8n.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <Button
          type="button"
          disabled={!threadId || pendingAction !== null}
          onClick={() =>
            runDemoAction("confirm", (selectedThreadId) =>
              simulateConfirmAppointment(selectedThreadId),
            )
          }
        >
          {pendingAction === "confirm" ? "Enviando..." : "Confirmar consulta"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!threadId || pendingAction !== null}
          onClick={() =>
            runDemoAction("reschedule", (selectedThreadId) =>
              simulateReschedule(selectedThreadId),
            )
          }
        >
          {pendingAction === "reschedule" ? "Enviando..." : "Reagendar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!threadId || pendingAction !== null}
          onClick={() =>
            runDemoAction("reminder", (selectedThreadId) =>
              simulateReminder(selectedThreadId),
            )
          }
        >
          {pendingAction === "reminder" ? "Enviando..." : "Enviar lembrete"}
        </Button>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao executar simulação.";
}
