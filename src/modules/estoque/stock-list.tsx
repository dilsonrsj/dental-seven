"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import type { StockAlertLevel, StockSupplyRow } from "./types";
import { MinQuantityForm } from "./min-quantity-form";
import { MovementHistoryModal } from "./movement-history-modal";
import { StockMovementForm } from "./stock-movement-form";

type StockListProps = {
  supplies: StockSupplyRow[];
  isAdmin: boolean;
};

type MovementModalState = {
  supply: StockSupplyRow;
  type: "inbound" | "outbound" | "adjustment";
} | null;

export function StockList({ supplies, isAdmin }: StockListProps) {
  const [items, setItems] = useState(supplies);
  const [movementModal, setMovementModal] = useState<MovementModalState>(null);
  const [minQuantitySupply, setMinQuantitySupply] = useState<StockSupplyRow | null>(
    null,
  );
  const [historySupply, setHistorySupply] = useState<StockSupplyRow | null>(null);

  function handleSupplyUpdated(updated: StockSupplyRow) {
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum insumo cadastrado. Cadastre insumos em Procedimentos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Saldo</th>
            <th className="px-4 py-3 font-medium">Unidade</th>
            <th className="px-4 py-3 font-medium">Mínimo</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((supply) => (
            <tr
              key={supply.id}
              className={`border-t border-border ${rowHighlightClass(supply.alert_level)}`}
            >
              <td className="px-4 py-3 font-medium">{supply.name}</td>
              <td className="px-4 py-3">{formatQuantity(supply.quantity_on_hand)}</td>
              <td className="px-4 py-3">{supply.unit_label}</td>
              <td className="px-4 py-3">
                {supply.min_quantity == null
                  ? "—"
                  : formatQuantity(supply.min_quantity)}
              </td>
              <td className="px-4 py-3">
                <AlertBadge level={supply.alert_level} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {isAdmin && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setMovementModal({ supply, type: "inbound" })
                        }
                      >
                        Entrada
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setMovementModal({ supply, type: "outbound" })
                        }
                      >
                        Saída
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMinQuantitySupply(supply)}
                      >
                        Mínimo
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setHistorySupply(supply)}
                  >
                    Histórico
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {movementModal && (
        <StockMovementForm
          supply={movementModal.supply}
          type={movementModal.type}
          onClose={() => setMovementModal(null)}
          onSuccess={(updated) => {
            handleSupplyUpdated(updated);
            setMovementModal(null);
          }}
        />
      )}

      {minQuantitySupply && (
        <MinQuantityForm
          supply={minQuantitySupply}
          onClose={() => setMinQuantitySupply(null)}
          onSuccess={(updated) => {
            handleSupplyUpdated(updated);
            setMinQuantitySupply(null);
          }}
        />
      )}

      {historySupply && (
        <MovementHistoryModal
          supply={historySupply}
          onClose={() => setHistorySupply(null)}
        />
      )}
    </div>
  );
}

function AlertBadge({ level }: { level: StockAlertLevel }) {
  if (level === "ok") {
    return (
      <Badge className="border-primary/30 text-primary">OK</Badge>
    );
  }

  if (level === "low") {
    return (
      <Badge className="border-amber-500/40 text-amber-600">Baixo</Badge>
    );
  }

  return (
    <Badge className="border-destructive/40 text-destructive">Crítico</Badge>
  );
}

function rowHighlightClass(level: StockAlertLevel) {
  if (level === "critical") return "bg-destructive/5";
  if (level === "low") return "bg-amber-500/5";
  return "";
}

function formatQuantity(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(3).replace(/\.?0+$/, "");
}
