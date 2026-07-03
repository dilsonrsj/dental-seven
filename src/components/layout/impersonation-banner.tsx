"use client";

import { stopClinicImpersonation } from "@/lib/admin/actions";

export function ImpersonationBanner() {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-400/50 bg-amber-100 px-4 py-2 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Modo suporte DR7 — somente leitura — sem acesso a prontuário
        </p>
        <form action={stopClinicImpersonation}>
          <button
            type="submit"
            className="rounded-lg border border-amber-600/40 bg-amber-50 px-3 py-1 text-sm font-medium hover:bg-amber-200"
          >
            Sair do modo suporte
          </button>
        </form>
      </div>
    </div>
  );
}
