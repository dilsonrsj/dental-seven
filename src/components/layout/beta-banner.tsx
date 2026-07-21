import Link from "next/link";
import {
  BETA_ENDS_SHORT,
  BETA_POST_END_MESSAGE,
} from "@/lib/founding/content";
import { isBetaGateEnabled } from "@/lib/founding/gate";

export function BetaBanner() {
  if (!isBetaGateEnabled()) {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-50 border-b border-amber-600/40 bg-amber-950 px-3 py-2.5 text-amber-50 sm:px-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-center text-xs sm:text-left sm:text-sm">
          <span className="font-semibold text-amber-300">
            Você está na versão beta
          </span>
          <span className="text-amber-100/90">
            {" "}
            — Disponível até{" "}
            <strong className="font-semibold text-amber-200">
              {BETA_ENDS_SHORT}
            </strong>
            .
          </span>
          <span className="mt-1 block text-amber-100/80 sm:mt-0 sm:inline">
            {" "}
            Fundadores: Conecta+ com{" "}
            <strong className="font-semibold text-amber-200">
              25% off em 12×
            </strong>
            .{" "}
            <Link href="/founding" className="underline hover:text-amber-50">
              Ver precificação
            </Link>
            . {BETA_POST_END_MESSAGE}
          </span>
        </p>
        <div className="flex items-center justify-center gap-2 sm:shrink-0">
          <Link
            href="/ajuda"
            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full border border-amber-400/50 bg-amber-900/60 px-3 py-1.5 text-center text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-800/80 sm:flex-none"
          >
            Guia rápido
          </Link>
          <Link
            href="/feedback"
            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full border border-amber-300/70 bg-amber-400 px-3 py-1.5 text-center text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-300 sm:flex-none"
          >
            Enviar feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
