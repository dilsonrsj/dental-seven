export const OTHER_PROCEDURE_VALUE = "__other__";

export type AgendaCatalogProcedure = {
  id: string;
  name: string;
  default_duration_min: number;
};

export function resolveAgendaProcedureFields(
  selection: string,
  freeTextOrProcedure: string | AgendaCatalogProcedure,
  catalog: AgendaCatalogProcedure[],
): {
  procedure_id: string | null;
  procedure_label: string;
  duration_min?: number;
} {
  if (selection === OTHER_PROCEDURE_VALUE) {
    const label =
      typeof freeTextOrProcedure === "string"
        ? freeTextOrProcedure.trim() || "Consulta"
        : "Consulta";
    return { procedure_id: null, procedure_label: label };
  }

  const found =
    typeof freeTextOrProcedure === "object"
      ? freeTextOrProcedure
      : catalog.find((item) => item.id === selection);

  if (!found) {
    throw new Error("Procedimento não encontrado no catálogo.");
  }

  return {
    procedure_id: found.id,
    procedure_label: found.name,
    duration_min: found.default_duration_min,
  };
}
