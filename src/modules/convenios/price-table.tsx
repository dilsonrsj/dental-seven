"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Input, toast } from "@/components/ui";
import {
  brlInputToCents,
  centsToBrlInput,
  formatBrlFromCents,
} from "@/modules/procedimentos/price-utils";
import type { ProcedureRow } from "@/modules/procedimentos/types";
import { listProcedurePrices, upsertProcedurePrice } from "./actions";
import type { InsurancePlanOption, InsuranceProcedurePriceRow } from "./types";

type PriceTableProps = {
  planOptions: InsurancePlanOption[];
  procedures: ProcedureRow[];
  readOnly?: boolean;
};

export function PriceTable({
  planOptions,
  procedures,
  readOnly = false,
}: PriceTableProps) {
  const [planId, setPlanId] = useState(planOptions[0]?.plan_id ?? "");
  const [prices, setPrices] = useState<InsuranceProcedurePriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planId) return;
    let active = true;
    setLoading(true);
    listProcedurePrices(planId)
      .then((rows) => {
        if (active) setPrices(rows);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [planId]);

  const priceByProcedure = new Map(
    prices.map((price) => [price.procedure_id, price]),
  );

  if (planOptions.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cadastre uma operadora e um plano ativos antes de definir preços.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (procedures.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cadastre procedimentos em Procedimentos para definir preços por
            convênio.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">Plano</span>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:max-w-md"
        >
          {planOptions.map((option) => (
            <option key={option.plan_id} value={option.plan_id}>
              {option.carrier_name} — {option.plan_name}
            </option>
          ))}
        </select>
      </label>

      <Card>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando preços…</p>
          ) : (
            <ul className="divide-y divide-border">
              {procedures.map((procedure) => (
                <PriceRow
                  key={procedure.id}
                  planId={planId}
                  procedure={procedure}
                  existing={priceByProcedure.get(procedure.id) ?? null}
                  readOnly={readOnly}
                  onSaved={(row) =>
                    setPrices((current) => {
                      const rest = current.filter(
                        (p) => p.procedure_id !== row.procedure_id,
                      );
                      return [...rest, row];
                    })
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PriceRow({
  planId,
  procedure,
  existing,
  readOnly = false,
  onSaved,
}: {
  planId: string;
  procedure: ProcedureRow;
  existing: InsuranceProcedurePriceRow | null;
  readOnly?: boolean;
  onSaved: (row: InsuranceProcedurePriceRow) => void;
}) {
  const [price, setPrice] = useState(
    existing ? centsToBrlInput(existing.price_cents) : "",
  );
  const [tuss, setTuss] = useState(existing?.tuss_code ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrice(existing ? centsToBrlInput(existing.price_cents) : "");
    setTuss(existing?.tuss_code ?? "");
  }, [existing]);

  async function save() {
    try {
      setSaving(true);
      const cents = brlInputToCents(price || "0");
      await upsertProcedurePrice({
        plan_id: planId,
        procedure_id: procedure.id,
        price_cents: cents,
        tuss_code: tuss,
      });
      onSaved({
        id: existing?.id ?? `${planId}-${procedure.id}`,
        plan_id: planId,
        procedure_id: procedure.id,
        price_cents: cents,
        tuss_code: tuss.trim() || null,
        procedure_name: procedure.name,
      });
      toast.success("Preço salvo.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-[160px] flex-1">
        <p className="text-sm font-medium">{procedure.name}</p>
        <p className="text-xs text-muted-foreground">
          Particular: {formatBrlFromCents(procedure.base_price_cents)}
        </p>
      </div>
      {readOnly ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>TUSS: {tuss || "—"}</span>
          <span>Convênio: {price ? formatBrlFromCents(brlInputToCents(price)) : "—"}</span>
        </div>
      ) : (
        <>
          <Input
            value={tuss}
            onChange={(e) => setTuss(e.target.value)}
            placeholder="TUSS"
            className="w-28"
          />
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className="w-32"
          />
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "…" : "Salvar"}
          </Button>
        </>
      )}
    </li>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível salvar.";
}
