import { getMessages, getThreads } from "@/modules/whatsapp/actions";
import { WhatsappPageClient } from "@/modules/whatsapp/whatsapp-page-client";

export default async function WhatsappPage() {
  const threads = await getThreads();
  const initialThreadId = threads[0]?.id ?? null;
  const initialMessages = initialThreadId
    ? await getMessages(initialThreadId)
    : [];

  return (
    <WhatsappPageClient
      threads={threads}
      initialThreadId={initialThreadId}
      initialMessages={initialMessages}
    />
  );
}
