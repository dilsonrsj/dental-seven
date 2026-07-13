import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { loadLegalDocument } from "@/lib/legal/load-legal-document";

export const metadata: Metadata = {
  title: "Política de Privacidade — Dental Seven",
  description:
    "Política de Privacidade e LGPD da plataforma Dental Seven, produto DR7 Performance.",
};

export default async function PrivacidadePage() {
  const markdown = await loadLegalDocument("politica-de-privacidade.md");

  return (
    <LegalDocumentPage
      markdown={markdown}
      crossLink={{
        href: "/termos",
        label: "Termos de Uso",
      }}
    />
  );
}
