import type { WhatsappMessage } from "@/lib/supabase/types";
import type { WhatsappThreadWithPatient } from "./actions";

type ChatViewProps = {
  thread: WhatsappThreadWithPatient | null;
  messages: WhatsappMessage[];
  isLoading?: boolean;
};

export function ChatView({ thread, messages, isLoading = false }: ChatViewProps) {
  if (!thread) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
        Selecione uma conversa para visualizar as mensagens demo.
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="border-b border-border p-4">
        <h2 className="font-display text-lg font-semibold">
          {thread.patient?.name ?? "Paciente demo"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Conversa simulada do WhatsApp Business
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma mensagem nesta conversa demo.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: WhatsappMessage }) {
  const outbound = message.direction === "outbound";

  return (
    <div className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
          outbound
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-surface text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        <p
          className={`mt-2 text-right text-[11px] ${
            outbound ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
        >
          {formatMessageTime(message.sent_at)}
          {outbound ? ` · ${statusLabel(message.status)}` : ""}
        </p>
      </div>
    </div>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusLabel(status: WhatsappMessage["status"]) {
  const labels: Record<WhatsappMessage["status"], string> = {
    sent: "enviada",
    delivered: "entregue",
    read: "lida",
  };

  return labels[status];
}
