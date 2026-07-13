"use client";

import { useState } from "react";
import type { ProcedureRow } from "@/modules/procedimentos/types";
import { CarrierList } from "./carrier-list";
import { ClaimList } from "./claim-list";
import { PriceTable } from "./price-table";
import type {
  InsuranceCarrierWithPlans,
  InsuranceClaimRow,
  InsurancePlanOption,
} from "./types";

type Tab = "operadoras" | "precos" | "guias" | "glosas";

type ConveniosPageClientProps = {
  carriers: InsuranceCarrierWithPlans[];
  planOptions: InsurancePlanOption[];
  procedures: ProcedureRow[];
  claims: InsuranceClaimRow[];
  isAdmin: boolean;
};

const TABS: { key: Tab; label: string }[] = [
  { key: "operadoras", label: "Operadoras" },
  { key: "precos", label: "Tabela de preços" },
  { key: "guias", label: "Guias" },
  { key: "glosas", label: "Glosas" },
];

export function ConveniosPageClient({
  carriers,
  planOptions,
  procedures,
  claims,
  isAdmin,
}: ConveniosPageClientProps) {
  const [tab, setTab] = useState<Tab>("operadoras");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Convênios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operadoras credenciadas, tabela de preços, guias e controle de glosas.
        </p>
        {!isAdmin && (
          <p className="mt-2 text-sm text-amber-300">
            Modo leitura — apenas o administrador da clínica pode alterar
            operadoras, preços e guias.
          </p>
        )}
      </div>

      <nav
        className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-1"
        aria-label="Seções de convênios"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors ${
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
            aria-current={tab === item.key ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "operadoras" && (
        <CarrierList initialCarriers={carriers} readOnly={!isAdmin} />
      )}
      {tab === "precos" && (
        <PriceTable
          planOptions={planOptions}
          procedures={procedures}
          readOnly={!isAdmin}
        />
      )}
      {tab === "guias" && (
        <ClaimList initialClaims={claims} readOnly={!isAdmin} />
      )}
      {tab === "glosas" && (
        <ClaimList initialClaims={claims} glosaOnly readOnly={!isAdmin} />
      )}
    </div>
  );
}
