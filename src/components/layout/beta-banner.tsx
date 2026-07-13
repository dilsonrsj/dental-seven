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
      className="sticky top-0 z-50 border-b border-amber-600/40 bg-amber-950 px-4 py-2.5 text-center text-xs text-amber-50 sm:text-sm"
    >
      <p>
        <span className="font-semibold text-amber-300">
          Você está na versão beta
        </span>
        <span className="text-amber-100/90">
          {" "}
          — Disponível até{" "}
          <strong className="font-semibold text-amber-200">{BETA_ENDS_SHORT}</strong>
          . {BETA_POST_END_MESSAGE}{" "}
        </span>
        <Link
          href="/feedback"
          className="font-semibold text-amber-200 underline-offset-2 hover:underline"
        >
          Enviar feedback
        </Link>
      </p>
    </div>
  );
}
