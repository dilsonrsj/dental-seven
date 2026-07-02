"use client";

import { useState, type ReactNode } from "react";
import { ProcedureList } from "./procedure-list";
import { SupplyList } from "./supply-list";
import type { ProcedureRow, SupplyRow } from "./types";

type ProcedimentosTabsProps = {
  procedures: ProcedureRow[];
  supplies: SupplyRow[];
  isAdmin: boolean;
};

type TabKey = "procedures" | "supplies";

export function ProcedimentosTabs({
  procedures,
  supplies,
  isAdmin,
}: ProcedimentosTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("procedures");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Procedimentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo de procedimentos e insumos da clínica.
        </p>

        {isAdmin ? (
          <div className="mt-4 flex gap-2">
            <TabButton
              active={activeTab === "procedures"}
              onClick={() => setActiveTab("procedures")}
            >
              Procedimentos
            </TabButton>
            <TabButton
              active={activeTab === "supplies"}
              onClick={() => setActiveTab("supplies")}
            >
              Insumos
            </TabButton>
          </div>
        ) : null}
      </div>

      {activeTab === "procedures" || !isAdmin ? (
        <ProcedureList
          procedures={procedures}
          supplies={supplies}
          isAdmin={isAdmin}
        />
      ) : (
        <SupplyList supplies={supplies} />
      )}
    </div>
  );
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
