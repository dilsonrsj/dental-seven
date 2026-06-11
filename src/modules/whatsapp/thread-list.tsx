import { Badge } from "@/components/ui";
import type { WhatsappThreadWithPatient } from "./actions";

type ThreadListProps = {
  threads: WhatsappThreadWithPatient[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
};

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
        Nenhuma conversa demo encontrada.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
      {threads.map((thread) => {
        const isSelected = thread.id === selectedThreadId;
        return (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectThread(thread.id)}
            className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-primary/5 ${
              isSelected ? "bg-primary/10" : ""
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
              {getInitials(thread.patient?.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-display font-semibold">
                  {thread.patient?.name ?? "Paciente demo"}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeDate(thread.last_message_at)}
                </span>
              </span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                WhatsApp {thread.patient?.whatsapp ?? "não informado"}
              </span>
              <Badge className="mt-2">Demo</Badge>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "DS";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}
