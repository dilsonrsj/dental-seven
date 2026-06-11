import {
  getMessages,
  getThreads,
  isSupabaseConfigured,
} from "@/modules/whatsapp/actions";
import { WhatsappPageClient } from "@/modules/whatsapp/whatsapp-page-client";

export default async function WhatsappPage() {
  if (!(await isSupabaseConfigured())) {
    return (
      <WhatsappPageClient
        threads={[]}
        initialThreadId={null}
        initialMessages={[]}
        configureMessage="Configure .env.local"
      />
    );
  }

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
