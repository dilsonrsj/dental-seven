import { describe, expect, it } from "vitest";
import { documentZipPath } from "./build-clinic-export";
import { toCsv } from "./csv";

describe("documentZipPath", () => {
  it("builds stable path under documents/", () => {
    expect(
      documentZipPath(
        "doc-1",
        "clinic/patient/doc-1/laudo.pdf",
      ),
    ).toBe("documents/doc-1_laudo.pdf");
  });
});

describe("toCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = toCsv(
      [{ id: "1", name: 'João, "Silva"', notes: "linha\n2" }],
      ["id", "name", "notes"],
    );
    expect(csv).toContain('"João, ""Silva"""');
    expect(csv).toContain('"linha\n2"');
  });

  it("handles empty rows", () => {
    expect(toCsv([], ["id", "name"])).toBe("id,name");
  });

  it("formats clinical note rows for export", () => {
    const csv = toCsv(
      [
        {
          id: "note-1",
          patient_id: "patient-1",
          appointment_id: null,
          author_id: "author-1",
          body: "Evolução clínica",
          created_at: "2026-07-02T12:00:00.000Z",
        },
      ],
      [
        "id",
        "patient_id",
        "appointment_id",
        "author_id",
        "body",
        "created_at",
      ],
    );
    expect(csv).toContain("note-1");
    expect(csv).toContain("Evolução clínica");
  });

  it("formats appointment rows with procedure_id", () => {
    const csv = toCsv(
      [
        {
          id: "appt-1",
          dentist_id: "dentist-1",
          patient_id: "patient-1",
          starts_at: "2026-07-02T14:00:00.000Z",
          ends_at: "2026-07-02T14:30:00.000Z",
          duration_min: 30,
          status: "scheduled",
          procedure_id: "proc-1",
          procedure_label: "Limpeza",
          notes: null,
          created_at: "2026-07-02T12:00:00.000Z",
        },
      ],
      [
        "id",
        "dentist_id",
        "patient_id",
        "starts_at",
        "ends_at",
        "duration_min",
        "status",
        "procedure_id",
        "procedure_label",
        "notes",
        "created_at",
      ],
    );
    expect(csv).toContain("proc-1");
    expect(csv).toContain("Limpeza");
  });

  it("formats procedure catalog rows for export", () => {
    const csv = toCsv(
      [
        {
          id: "proc-1",
          name: "Limpeza",
          base_price_cents: 14990,
          default_duration_min: 45,
          is_active: true,
          created_at: "2026-07-02T12:00:00.000Z",
          updated_at: "2026-07-02T12:00:00.000Z",
        },
      ],
      [
        "id",
        "name",
        "base_price_cents",
        "default_duration_min",
        "is_active",
        "created_at",
        "updated_at",
      ],
    );
    expect(csv).toContain("proc-1");
    expect(csv).toContain("14990");
  });

  it("formats BOM rows for export", () => {
    const csv = toCsv(
      [
        {
          id: "bom-1",
          procedure_id: "proc-1",
          supply_id: "supply-1",
          quantity: 2,
        },
      ],
      ["id", "procedure_id", "supply_id", "quantity"],
    );
    expect(csv).toContain("bom-1");
    expect(csv).toContain("2");
  });

  it("formats supply rows with stock columns for export", () => {
    const csv = toCsv(
      [
        {
          id: "supply-1",
          name: "Luva",
          unit_label: "par",
          unit_cost_cents: 500,
          sku: "LV-01",
          quantity_on_hand: 10,
          min_quantity: 5,
          is_active: true,
          created_at: "2026-07-02T12:00:00.000Z",
          updated_at: "2026-07-02T12:00:00.000Z",
        },
      ],
      [
        "id",
        "name",
        "unit_label",
        "unit_cost_cents",
        "sku",
        "quantity_on_hand",
        "min_quantity",
        "is_active",
        "created_at",
        "updated_at",
      ],
    );
    expect(csv).toContain("quantity_on_hand");
    expect(csv).toContain("10");
    expect(csv).toContain("5");
  });

  it("formats stock movement rows for export", () => {
    const csv = toCsv(
      [
        {
          id: "mov-1",
          supply_id: "supply-1",
          movement_type: "auto_deduction",
          quantity: -2,
          quantity_after: 8,
          appointment_id: "appt-1",
          notes: null,
          created_by: "user-1",
          created_at: "2026-07-02T14:00:00.000Z",
        },
      ],
      [
        "id",
        "supply_id",
        "movement_type",
        "quantity",
        "quantity_after",
        "appointment_id",
        "notes",
        "created_by",
        "created_at",
      ],
    );
    expect(csv).toContain("auto_deduction");
    expect(csv).toContain("-2");
    expect(csv).toContain("8");
  });

  it("formats financial entry rows for export", () => {
    const csv = toCsv(
      [
        {
          id: "entry-1",
          entry_type: "revenue",
          source: "auto",
          amount_cents: 15000,
          appointment_id: "appt-1",
          procedure_id: "proc-1",
          dentist_id: "dentist-1",
          description: "Limpeza",
          entry_date: "2026-07-02",
          created_by: "user-1",
          created_at: "2026-07-02T14:00:00.000Z",
        },
      ],
      [
        "id",
        "entry_type",
        "source",
        "amount_cents",
        "appointment_id",
        "procedure_id",
        "dentist_id",
        "description",
        "entry_date",
        "created_by",
        "created_at",
      ],
    );
    expect(csv).toContain("entry-1");
    expect(csv).toContain("revenue");
    expect(csv).toContain("15000");
    expect(csv).toContain("Limpeza");
  });

  it("formats clinic monthly settings rows for export", () => {
    const csv = toCsv(
      [
        {
          clinic_id: "clinic-1",
          year_month: "2026-07",
          fixed_costs_cents: 500000,
          updated_at: "2026-07-02T12:00:00.000Z",
        },
      ],
      ["clinic_id", "year_month", "fixed_costs_cents", "updated_at"],
    );
    expect(csv).toContain("2026-07");
    expect(csv).toContain("500000");
  });
});
