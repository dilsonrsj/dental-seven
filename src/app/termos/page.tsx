import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { loadLegalDocument } from "@/lib/legal/load-legal-document";

export const metadata: Metadata = {
  title: "Termos de Uso — Dental Seven",
  description: "Termos de Uso da plataforma Dental Seven, produto DR7 Performance.",
};

export default async function TermosPage() {
  const markdown = await loadLegalDocument("termos-de-uso.md");

  return (
    <LegalDocumentPage
      markdown={markdown}
      crossLink={{
        href: "/privacidade",
        label: "Política de Privacidade",
      }}
    />
  );
}
