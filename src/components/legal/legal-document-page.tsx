import Link from "next/link";
import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { renderLegalMarkdown } from "@/lib/legal/render-markdown";

type LegalDocumentPageProps = {
  markdown: string;
  crossLink: { href: string; label: string };
};

export function LegalDocumentPage({
  markdown,
  crossLink,
}: LegalDocumentPageProps) {
  const content = renderLegalMarkdown(markdown);

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Link href="/entrar" aria-label="Voltar para entrar">
            <DentalSevenLogo
              variant="full"
              surface="entrar"
              height={120}
              className="h-auto w-auto max-w-[220px]"
            />
          </Link>
        </div>

        <article className="space-y-3 rounded-2xl border border-border bg-surface/50 p-6 sm:p-10">
          {content}
        </article>

        <footer className="mt-8 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
          <p>
            <Link href={crossLink.href} className="text-primary hover:underline">
              {crossLink.label}
            </Link>
            {" · "}
            <Link href="/entrar" className="text-primary hover:underline">
              Voltar para entrar
            </Link>
            {" · "}
            <Link href="/cadastro" className="text-primary hover:underline">
              Criar conta
            </Link>
          </p>
          <p className="text-xs">DR7 Performance · CNPJ 52.895.412/0001-30</p>
        </footer>
      </div>
    </div>
  );
}
