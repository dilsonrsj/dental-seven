# Dental Seven v5 — Financeiro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Receita e custo variável automáticos ao concluir consultas, lançamentos manuais, custos fixos mensais e dashboard de margem — módulo `financeiro` no plano Completo (MicroSaaS enxuto).

**Architecture:** Migration `013` com `financial_entries`, `clinic_monthly_settings`, `appointment_finance_applied`; módulo `src/modules/financeiro/`; hook em `updateAppointmentStatus` / `upsertAppointment` (padrão v4 estoque); dashboard mínimo em `/financeiro`.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-v5-financeiro-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`** (demo Vercel).

---

## Workflow Git

| Branch | Uso |
|--------|-----|
| `main` | Demo deployada na Vercel — **intocável** |
| `feat/v2` | v2 … v5 — commit a cada task concluída |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/013_financial_ledger.sql` | Ledger financeiro + settings mensais |
| `src/modules/financeiro/types.ts` | Tipos entry, summary, forms |
| `src/modules/financeiro/validation.ts` | amount_cents, description, year_month |
| `src/modules/financeiro/validation.test.ts` | Vitest |
| `src/modules/financeiro/month-summary.ts` | Agregação receita/custo/margem |
| `src/modules/financeiro/month-summary.test.ts` | Vitest |
| `src/modules/financeiro/appointment-finance.ts` | Auto apply/reversal |
| `src/modules/financeiro/appointment-finance.test.ts` | Vitest |
| `src/modules/financeiro/actions.ts` | Entries, settings, listagens |
| `src/modules/financeiro/finance-dashboard.tsx` | Cards + tabela |
| `src/modules/financeiro/manual-entry-form.tsx` | Modal receita/despesa manual |
| `src/modules/financeiro/fixed-costs-form.tsx` | Modal custos fixos |
| `src/app/(app)/financeiro/page.tsx` | Gate módulo + role |
| `src/components/layout/nav-links.ts` | Link Financeiro |
| `src/components/layout/filter-nav.ts` | Gate `financeiro` |
| `src/lib/auth/routes.ts` | `/financeiro` prefix |
| `src/modules/agenda/actions.ts` | Hook financeiro + `financeResult` |
| `src/modules/agenda/agenda-page-client.tsx` | Toast financeiro |
| `src/lib/export/build-clinic-export.ts` | Export schema 1.5 |
| `scripts/smoke-financeiro.ts` | Smoke ledger + margem |

---

## Tasks

- [ ] Task 1: Migration `013_financial_ledger` + aplicar Supabase
- [ ] Task 2: `validation.ts` + `month-summary.ts` + testes Vitest
- [ ] Task 3: `appointment-finance.ts` + testes Vitest
- [ ] Task 4: Server actions — entries, settings, listagens
- [ ] Task 5: UI `/financeiro` (dashboard admin + visão dentista)
- [ ] Task 6: Menu Financeiro
- [ ] Task 7: Integração agenda (hook + toast)
- [ ] Task 8: Export LGPD schema 1.5
- [ ] Task 9: Smoke `scripts/smoke-financeiro.ts`
- [ ] Task 10: Marcar spec §10 aceite + commit final da fase

---

## Task 1: Migration financial ledger

**Files:**
- Create: `supabase/migrations/013_financial_ledger.sql`

- [ ] **Step 1:** Criar migration conforme spec §4

```sql
-- v5: financial ledger

create type financial_entry_type as enum (
  'revenue',
  'revenue_reversal',
  'variable_cost',
  'variable_cost_reversal',
  'manual_revenue',
  'manual_expense'
);

create type financial_entry_source as enum ('auto', 'manual');

create table clinic_monthly_settings (
  clinic_id uuid not null references clinics(id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  fixed_costs_cents integer not null default 0 check (fixed_costs_cents >= 0),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, year_month)
);

create table financial_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  entry_type financial_entry_type not null,
  source financial_entry_source not null,
  amount_cents integer not null check (amount_cents <> 0),
  appointment_id uuid references appointments(id) on delete set null,
  procedure_id uuid references procedures(id) on delete set null,
  dentist_id uuid references dentists(id) on delete set null,
  description text not null,
  entry_date date not null default (current_date),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table appointment_finance_applied (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  applied_at timestamptz not null default now(),
  reversed_at timestamptz
);

create index idx_financial_entries_clinic_date
  on financial_entries(clinic_id, entry_date desc);

create index idx_financial_entries_appointment
  on financial_entries(appointment_id)
  where appointment_id is not null;

create index idx_financial_entries_dentist_date
  on financial_entries(dentist_id, entry_date desc)
  where dentist_id is not null;

alter table clinic_monthly_settings enable row level security;
alter table financial_entries enable row level security;
alter table appointment_finance_applied enable row level security;

create policy "clinic_monthly_settings_clinic" on clinic_monthly_settings for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "financial_entries_clinic" on financial_entries for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "appointment_finance_applied_clinic" on appointment_finance_applied for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
```

- [ ] **Step 2:** Aplicar via Supabase MCP `apply_migration` (nome: `financial_ledger`)

- [ ] **Step 3:** Commit `feat(v5): migration financial ledger`

---

## Task 2: Validação e month-summary

**Files:**
- Create: `src/modules/financeiro/types.ts`
- Create: `src/modules/financeiro/validation.ts`, `validation.test.ts`
- Create: `src/modules/financeiro/month-summary.ts`, `month-summary.test.ts`

- [ ] **Step 1:** Testes falhando

`month-summary.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { computeMonthSummary } from "./month-summary";

describe("computeMonthSummary", () => {
  it("calcula margem do mês", () => {
    const result = computeMonthSummary({
      entries: [
        { entry_type: "revenue", amount_cents: 20000 },
        { entry_type: "variable_cost", amount_cents: -5000 },
        { entry_type: "manual_expense", amount_cents: -1000 },
      ],
      fixedCostsCents: 8000,
    });
    expect(result.revenueCents).toBe(20000);
    expect(result.variableCostCents).toBe(6000);
    expect(result.fixedCostsCents).toBe(8000);
    expect(result.marginCents).toBe(6000);
  });

  it("inclui estornos na receita", () => {
    const result = computeMonthSummary({
      entries: [
        { entry_type: "revenue", amount_cents: 15000 },
        { entry_type: "revenue_reversal", amount_cents: -15000 },
      ],
      fixedCostsCents: 0,
    });
    expect(result.revenueCents).toBe(0);
  });
});
```

`validation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  assertAmountCents,
  assertEntryDescription,
  assertYearMonth,
  toExpenseAmountCents,
} from "./validation";

describe("validation", () => {
  it("rejeita valor zero", () => {
    expect(() => assertAmountCents(0)).toThrow();
  });

  it("aceita year_month válido", () => {
    expect(assertYearMonth("2026-07")).toBe("2026-07");
  });

  it("converte despesa manual para negativo", () => {
    expect(toExpenseAmountCents(1000)).toBe(-1000);
  });
});
```

- [ ] **Step 2:** Implementar `types.ts`, `validation.ts`, `month-summary.ts`

`month-summary.ts`:

```typescript
import type { FinancialEntryType } from "./types";

type SummaryEntry = {
  entry_type: FinancialEntryType;
  amount_cents: number;
};

const REVENUE_TYPES: FinancialEntryType[] = [
  "revenue",
  "revenue_reversal",
  "manual_revenue",
];

const VARIABLE_COST_TYPES: FinancialEntryType[] = [
  "variable_cost",
  "variable_cost_reversal",
  "manual_expense",
];

export function computeMonthSummary(input: {
  entries: SummaryEntry[];
  fixedCostsCents: number;
}) {
  const revenueCents = input.entries
    .filter((e) => REVENUE_TYPES.includes(e.entry_type))
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const variableCostCents = Math.abs(
    input.entries
      .filter((e) => VARIABLE_COST_TYPES.includes(e.entry_type))
      .reduce((sum, e) => sum + e.amount_cents, 0),
  );

  const fixedCostsCents = input.fixedCostsCents;
  const marginCents = revenueCents - variableCostCents - fixedCostsCents;

  return { revenueCents, variableCostCents, fixedCostsCents, marginCents };
}
```

- [ ] **Step 3:** `npm run test -- src/modules/financeiro/` — PASS nos novos testes

- [ ] **Step 4:** Commit `feat(v5): validacao e month summary financeiro`

---

## Task 3: Appointment finance (auto apply/reversal)

**Files:**
- Create: `src/modules/financeiro/appointment-finance.ts`, `appointment-finance.test.ts`

- [ ] **Step 1:** Funções puras + testes

```typescript
export function shouldApplyAutoFinance(input: {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  financeModuleEnabled: boolean;
  alreadyApplied: boolean;
}): boolean { /* → completed, module on, not applied */ }

export function shouldApplyAutoFinanceReversal(input: {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  financeModuleEnabled: boolean;
  alreadyApplied: boolean;
}): boolean { /* completed → other */ }

export function buildRevenueEntryDraft(input: {
  procedureName: string;
  basePriceCents: number;
}): { entry_type: "revenue"; amount_cents: number; description: string } { /* ... */ }

export function buildVariableCostDrafts(
  bomItems: Array<{ supply_name: string; quantity: number; unit_cost_cents: number | null }>,
): Array<{ entry_type: "variable_cost"; amount_cents: number; description: string }> {
  /* qty * unit_cost, skip null costs */
}
```

- [ ] **Step 2:** `applyFinanceForAppointmentStatusChange(appointmentId, previousStatus, newStatus)`:
  - Carrega appointment (procedure_id, dentist_id, clinic_id)
  - Se apply: procedure + BOM → insert entries `source=auto` + `appointment_finance_applied`
  - Se reversal: busca auto entries → insert reversals → `reversed_at`
  - Return `{ applied, reversed }`

- [ ] **Step 3:** Commit `feat(v5): financeiro automatico na agenda`

---

## Task 4: Server actions

**Files:**
- Create: `src/modules/financeiro/actions.ts`

- [ ] **Step 1:** `requireFinanceiroModule`, `assertWritableAdmin`

- [ ] **Step 2:** Implementar:

```typescript
export async function getMonthFinanceSummary(yearMonth: string) { /* admin full */ }
export async function getDentistRevenueSummary(yearMonth: string) { /* dentist only */ }
export async function listFinancialEntries(yearMonth: string, limit = 30) { /* ... */ }
export async function createManualEntry(input: {
  kind: "revenue" | "expense";
  amountCents: number;
  description: string;
  entryDate?: string;
}) { /* manual_revenue | manual_expense */ }
export async function updateMonthlyFixedCosts(yearMonth: string, fixedCostsCents: number) { /* upsert clinic_monthly_settings */ }
```

- [ ] **Step 3:** Demo: summaries zerados, listas vazias

- [ ] **Step 4:** Commit `feat(v5): actions financeiro entries e settings`

---

## Task 5: UI `/financeiro`

**Files:**
- Create: `src/app/(app)/financeiro/page.tsx`
- Create: `src/modules/financeiro/finance-dashboard.tsx`
- Create: `src/modules/financeiro/manual-entry-form.tsx`
- Create: `src/modules/financeiro/fixed-costs-form.tsx`

- [ ] **Step 1:** `page.tsx` — gate `financeiro`, redirect se inativo; passar `isAdmin`, `dentistId` (se dentist)

- [ ] **Step 2:** Admin: seletor mês + 4 cards + tabela + botões Novo lançamento / Custos fixos

- [ ] **Step 3:** Dentista: card "Minha receita" + lista filtrada (sem custos/margem)

- [ ] **Step 4:** Usar `formatBrlFromCents` de `procedimentos/price-utils`

- [ ] **Step 5:** Commit `feat(v5): pagina financeiro dashboard`

---

## Task 6: Menu

**Files:**
- Modify: `nav-links.ts`, `filter-nav.ts`, `routes.ts`, `routes.test.ts`

- [ ] **Step 1:** Adicionar após Estoque:

```typescript
import { Wallet } from "lucide-react";
{ href: "/financeiro", label: "Financeiro", icon: Wallet },
```

- [ ] **Step 2:** `filter-nav.ts`: `"/financeiro": "financeiro"`

- [ ] **Step 3:** Commit `feat(v5): menu financeiro`

---

## Task 7: Integração agenda

**Files:**
- Modify: `src/modules/agenda/actions.ts`, `agenda-page-client.tsx`

- [ ] **Step 1:** Estender `AppointmentMutationResult`:

```typescript
export type AppointmentMutationResult = {
  appointment: AppointmentWithRelations;
  stockResult?: { applied: boolean; reversed: boolean };
  financeResult?: { applied: boolean; reversed: boolean };
};
```

- [ ] **Step 2:** Após `applyStockForAppointmentStatusChange`, chamar `applyFinanceForAppointmentStatusChange`; `revalidatePath("/financeiro")`

- [ ] **Step 3:** Toast *"Financeiro atualizado"* se `financeResult?.applied`

- [ ] **Step 4:** `npm run test` — PASS

- [ ] **Step 5:** Commit `feat(v5): integracao financeiro na agenda`

---

## Task 8: Export LGPD

**Files:**
- Modify: `build-clinic-export.ts`, `build-clinic-export.test.ts`

- [ ] **Step 1:** `EXPORT_SCHEMA_VERSION = "1.5"`

- [ ] **Step 2:** Query `financial_entries`, `clinic_monthly_settings`, `appointment_finance_applied`

- [ ] **Step 3:** JSON/CSV + manifest counts; atualizar `smoke-estoque.ts` / `smoke-procedimentos.ts` se checarem schemaVersion

- [ ] **Step 4:** Commit `feat(v5): export LGPD financial entries`

---

## Task 9: Smoke

**Files:**
- Create: `scripts/smoke-financeiro.ts`

- [ ] **Step 1:** Login smoke clinic; habilitar `financeiro` + `procedimentos`

- [ ] **Step 2:** Procedure com preço + supply com unit_cost + BOM

- [ ] **Step 3:** Complete appointment → verify `revenue` + `variable_cost` entries

- [ ] **Step 4:** Reopen → verify reversals

- [ ] **Step 5:** Manual entry + fixed costs + export 1.5

- [ ] **Step 6:** Cleanup; commit `test(v5): smoke financeiro ledger e margem`

---

## Task 10: Aceite spec

- [ ] **Step 1:** Marcar critérios §10 na spec
- [ ] **Step 2:** Marcar tasks [x] no plano
- [ ] **Step 3:** Commit `docs(v5): aceite spec financeiro concluido`

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-07-02-dental-seven-v5-financeiro.md`.

**Próximo:** executar Tasks 1–10 na branch `feat/v2`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute in this session with executing-plans checkpoints
