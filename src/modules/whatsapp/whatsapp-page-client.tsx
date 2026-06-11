"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import type { WhatsappMessage } from "@/lib/supabase/types";
import { getMessages, getThreads, type WhatsappThreadWithPatient } from "./actions";
import { ChatView } from "./chat-view";
import { DemoActions } from "./demo-actions";
import { ThreadList } from "./thread-list";

type WhatsappPageClientProps = {
  threads: WhatsappThreadWithPatient[];
  initialThreadId: string | null;
  initialMessages: WhatsappMessage[];
  configureMessage?: string;
};

export function WhatsappPageClient({
  threads: initialThreads,
  initialThreadId,
  initialMessages,
  configureMessage,
}: WhatsappPageClientProps) {
  const [threads, setThreads] =
    useState<WhatsappThreadWithPatient[]>(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId,
  );
  const [messages, setMessages] = useState<WhatsappMessage[]>(initialMessages);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    initialThreadId ? "chat" : "list",
  );

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  async function handleSelectThread(threadId: string) {
    setSelectedThreadId(threadId);
    setMobileView("chat");

    try {
      setIsLoadingMessages(true);
      setMessages(await getMessages(threadId));
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function reloadSelectedThread() {
    if (!selectedThreadId) return;

    const [nextThreads, nextMessages] = await Promise.all([
      getThreads(),
      getMessages(selectedThreadId),
    ]);
    setThreads(nextThreads);
    setMessages(nextMessages);
  }

  if (configureMessage) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <Card>
          <CardContent>
            <p className="font-medium">{configureMessage}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Defina `NEXT_PUBLIC_SUPABASE_URL` e
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` para carregar as conversas demo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader />

      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <p className="font-display text-sm font-semibold uppercase tracking-wider text-primary">
          Demonstração
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Inbox simulada com dados fictícios. Em produção, envio, confirmação,
          lembretes e reagendamento serão orquestrados via n8n.
        </p>
      </div>

      <div className="flex gap-2 lg:hidden">
        <Button
          type="button"
          variant={mobileView === "list" ? "primary" : "outline"}
          className="flex-1"
          onClick={() => setMobileView("list")}
        >
          Conversas
        </Button>
        <Button
          type="button"
          variant={mobileView === "chat" ? "primary" : "outline"}
          className="flex-1"
          disabled={!selectedThreadId}
          onClick={() => setMobileView("chat")}
        >
          Chat
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={mobileView === "chat" ? "hidden lg:block" : "block"}>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
          />
        </aside>

        <section className={mobileView === "list" ? "hidden lg:block" : "block"}>
          <div className="space-y-4">
            <ChatView
              thread={selectedThread}
              messages={messages}
              isLoading={isLoadingMessages}
            />
            <DemoActions
              threadId={selectedThreadId}
              onDone={reloadSelectedThread}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">WhatsApp demo</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Inbox WhatsApp
      </h1>
      <p className="text-sm text-muted-foreground">
        Visualize conversas fictícias e acione simulações do fluxo operacional.
      </p>
    </div>
  );
}
