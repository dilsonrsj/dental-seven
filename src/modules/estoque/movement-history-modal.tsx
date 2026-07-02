"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { listSupplyMovements } from "./actions";
import type { StockMovementRow, StockMovementType, StockSupplyRow } from "./types";

type MovementHistoryModalProps = {
  supply: StockSupplyRow;
  onClose: () => void;
};

const movementTypeLabels: Record<StockMovementType, string> = {
  inbound: "Entrada",
  outbound: "Saída",
  adjustment: "Ajuste",
  auto_deduction: "Baixa automática",
  auto_reversal: "Estorno automático",
};

export function MovementHistoryModal({
  supply,
  onClose,
}: MovementHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const rows = await listSupplyMovements(supply.id, 20);
        if (!cancelled) {
          setMovements(rows);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Erro ao carregar histórico.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supply.id]);

  return (
    <Modal open onClose={onClose} title={`Histórico — ${supply.name}`}>
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma movimentação registrada para este insumo.
          </p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Qtd.</th>
                  <th className="px-3 py-2 font-medium">Saldo após</th>
                  <th className="px-3 py-2 font-medium">Consulta</th>
                  <th className="px-3 py-2 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDateTime(movement.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      {movementTypeLabels[movement.movement_type]}
                    </td>
                    <td className="px-3 py-2">
                      {formatSignedQuantity(movement.quantity)}
                    </td>
                    <td className="px-3 py-2">
                      {formatQuantity(movement.quantity_after)}
                    </td>
                    <td className="px-3 py-2">
                      {movement.appointment_id ? "Sim" : "—"}
                    </td>
                    <td className="px-3 py-2">{movement.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatQuantity(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function formatSignedQuantity(value: number) {
  const formatted = formatQuantity(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}
