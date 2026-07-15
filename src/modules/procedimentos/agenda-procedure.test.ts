import { describe, expect, it } from "vitest";
import {
  OTHER_PROCEDURE_VALUE,
  resolveAgendaProcedureFields,
} from "./agenda-procedure";

const catalogProcedure = {
  id: "proc-1",
  name: "Limpeza",
  default_duration_min: 45,
  base_price_cents: 22000,
};

describe("resolveAgendaProcedureFields", () => {
  it("catálogo preenche id, label e duração", () => {
    expect(
      resolveAgendaProcedureFields("proc-1", catalogProcedure, [catalogProcedure]),
    ).toEqual({
      procedure_id: "proc-1",
      procedure_label: "Limpeza",
      duration_min: 45,
    });
  });

  it("outro limpa procedure_id e usa texto livre", () => {
    expect(
      resolveAgendaProcedureFields(OTHER_PROCEDURE_VALUE, "Retorno rápido", []),
    ).toEqual({
      procedure_id: null,
      procedure_label: "Retorno rápido",
      duration_min: undefined,
    });
  });
});
