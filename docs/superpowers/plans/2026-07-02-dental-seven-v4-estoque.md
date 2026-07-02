# Dental Seven v4 — Estoque Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ledger de movimentações, alertas de estoque mínimo e baixa/estorno automático via BOM ao concluir consultas — módulo `estoque` no plano Completo (MicroSaaS enxuto).

**Architecture:** Migration `012` com `stock_movements`, `appointment_stock_applied` e colunas em `supplies`; módulo `src/modules/estoque/`; hook em `updateAppointmentStatus` e `upsertAppointment` quando status muda; badge de alertas no menu.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-v4-estoque-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`** (demo Vercel).

---

## Workflow Git

| Branch | Uso |
|--------|-----|
| `main` | Demo deployada na Vercel — **intocável** |
| `feat/v2` | v2 … v4 — commit a cada task concluída |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/012_stock_ledger.sql` | Ledger + `supplies` saldo/mínimo |
| `src/modules/estoque/types.ts` | Tipos movimento, alerta, supply com estoque |
| `src/modules/estoque/stock-level.ts` | `getStockAlertLevel`, `isStockAlert` |
| `src/modules/estoque/stock-level.test.ts` | Vitest alertas |
| `src/modules/estoque/validation.ts` | Quantidade movimento, min_quantity |
| `src/modules/estoque/validation.test.ts` | Vitest |
| `src/modules/estoque/appointment-stock.ts` | Baixa/estorno automático |
| `src/modules/estoque/appointment-stock.test.ts` | Vitest baixa/estorno |
| `src/modules/estoque/actions.ts` | Listagem, movimentos, contagem alertas |
| `src/modules/estoque/stock-list.tsx` | Tabela insumos + ações admin |
| `src/modules/estoque/stock-movement-form.tsx` | Modal entrada/saída/ajuste |
| `src/modules/estoque/movement-history-modal.tsx` | Histórico últimas 20 |
| `src/modules/estoque/min-quantity-form.tsx` | Modal editar mínimo |
| `src/app/(app)/estoque/page.tsx` | Gate módulo + role |
| `src/components/layout/stock-alert-badge.tsx` | Badge contador no menu |
| `src/components/layout/nav-links.ts` | Link Estoque |
| `src/components/layout/filter-nav.ts` | Gate `estoque` |
| `src/components/layout/app-sidebar.tsx` | Render badge em link Estoque |
| `src/components/layout/bottom-nav.tsx` | Badge mobile |
| `src/lib/auth/routes.ts` | `/estoque` em `CLINIC_APP_PREFIXES` |
| `src/modules/agenda/actions.ts` | Hook `applyStockForAppointmentStatusChange` |
| `src/modules/agenda/agenda-page-client.tsx` | Toast "Estoque atualizado" |
| `src/lib/export/build-clinic-export.ts` | Export schema 1.4 |
| `src/lib/export/build-clinic-export.test.ts` | Testes export |
| `scripts/smoke-estoque.ts` | Smoke ledger + baixa + estorno |

---

## Tasks

- [ ] Task 1: Migration `012_stock_ledger` + aplicar Supabase
- [ ] Task 2: `stock-level.ts` + `validation.ts` + testes Vitest
- [ ] Task 3: `appointment-stock.ts` + testes Vitest (baixa/estorno)
- [ ] Task 4: Server actions — listagem, movimentos, alertas
- [ ] Task 5: UI `/estoque` (tabela, modais, histórico)
- [ ] Task 6: Menu Estoque + badge de alertas
- [ ] Task 7: Integração agenda (hook + toast)
- [ ] Task 8: Export LGPD schema 1.4
- [ ] Task 9: Smoke `scripts/smoke-estoque.ts`
- [ ] Task 10: Marcar spec §10 aceite + commit final da fase

---

## Task 1: Migration stock ledger

**Files:**
- Create: `supabase/migrations/012_stock_ledger.sql`

- [ ] **Step 1:** Criar migration conforme spec §4

```sql
-- v4: stock ledger + appointment deduction tracking

create type stock_movement_type as enum (
  'inbound',
  'outbound',
  'adjustment',
  'auto_deduction',
  'auto_reversal'
);

alter table supplies
  add column if not exists quantity_on_hand numeric(12, 3) not null default 0,
  add column if not exists min_quantity numeric(12, 3)
    check (min_quantity is null or min_quantity >= 0);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete restrict,
  movement_type stock_movement_type not null,
  quantity numeric(12, 3) not null check (quantity <> 0),
  quantity_after numeric(12, 3) not null,
  appointment_id uuid references appointments(id) on delete set null,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table appointment_stock_applied (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  deduction_applied_at timestamptz not null default now(),
  reversed_at timestamptz
);

create index idx_stock_movements_supply_created
  on stock_movements(supply_id, created_at desc);

create index idx_stock_movements_clinic_created
  on stock_movements(clinic_id, created_at desc);

create index idx_stock_movements_appointment
  on stock_movements(appointment_id)
  where appointment_id is not null;

alter table stock_movements enable row level security;
alter table appointment_stock_applied enable row level security;

create policy "stock_movements_clinic" on stock_movements for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "appointment_stock_applied_clinic" on appointment_stock_applied for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
```

- [ ] **Step 2:** Aplicar via Supabase MCP `apply_migration` (nome: `stock_ledger`)

- [ ] **Step 3:** Commit `feat(v4): migration stock ledger`

---

## Task 2: Alertas e validação

**Files:**
- Create: `src/modules/estoque/types.ts` (tipos base)
- Create: `src/modules/estoque/stock-level.ts`, `stock-level.test.ts`
- Create: `src/modules/estoque/validation.ts`, `validation.test.ts`

- [ ] **Step 1:** Testes falhando

`stock-level.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { getStockAlertLevel, isStockAlert } from "./stock-level";

describe("getStockAlertLevel", () => {
  it("crítico quando saldo negativo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: -1, min_quantity: 5 }),
    ).toBe("critical");
  });

  it("baixo quando abaixo do mínimo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: 2, min_quantity: 5 }),
    ).toBe("low");
  });

  it("ok quando acima do mínimo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: 10, min_quantity: 5 }),
    ).toBe("ok");
  });

  it("ok sem mínimo definido e saldo positivo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: 0, min_quantity: null }),
    ).toBe("ok");
  });
});

describe("isStockAlert", () => {
  it("true para low e critical", () => {
    expect(isStockAlert("low")).toBe(true);
    expect(isStockAlert("critical")).toBe(true);
    expect(isStockAlert("ok")).toBe(false);
  });
});
```

`validation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  assertMovementQuantity,
  assertMinQuantity,
  movementQuantityForType,
} from "./validation";

describe("assertMovementQuantity", () => {
  it("rejeita zero", () => {
    expect(() => assertMovementQuantity(0)).toThrow();
  });

  it("aceita decimal", () => {
    expect(assertMovementQuantity(1.5)).toBe(1.5);
  });
});

describe("movementQuantityForType", () => {
  it("inbound positivo", () => {
    expect(movementQuantityForType("inbound", 3)).toBe(3);
  });

  it("outbound negativo", () => {
    expect(movementQuantityForType("outbound", 3)).toBe(-3);
  });
});
```

- [ ] **Step 2:** Implementar

`stock-level.ts`:

```typescript
export type StockAlertLevel = "ok" | "low" | "critical";

export type StockLevelInput = {
  quantity_on_hand: number;
  min_quantity: number | null;
};

export function getStockAlertLevel(supply: StockLevelInput): StockAlertLevel {
  if (supply.quantity_on_hand < 0) return "critical";
  if (
    supply.min_quantity != null &&
    supply.quantity_on_hand < supply.min_quantity
  ) {
    return "low";
  }
  return "ok";
}

export function isStockAlert(level: StockAlertLevel): boolean {
  return level === "low" || level === "critical";
}
```

`validation.ts`:

```typescript
import { assertBomQuantity } from "@/modules/procedimentos/validation";
import type { StockMovementType } from "./types";

export function assertMovementQuantity(value: number): number {
  return assertBomQuantity(value);
}

export function assertMinQuantity(value: number | null): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Estoque mínimo deve ser zero ou maior.");
  }
  return Math.round(value * 1000) / 1000;
}

export function movementQuantityForType(
  type: Exclude<StockMovementType, "adjustment" | "auto_deduction" | "auto_reversal">,
  absoluteQuantity: number,
): number {
  const qty = assertMovementQuantity(absoluteQuantity);
  return type === "inbound" ? qty : -qty;
}
```

- [ ] **Step 3:** `npm run test -- src/modules/estoque/stock-level.test.ts src/modules/estoque/validation.test.ts` — PASS

- [ ] **Step 4:** Commit `feat(v4): alertas e validacao estoque`

---

## Task 3: Baixa e estorno automático

**Files:**
- Create: `src/modules/estoque/types.ts`
- Create: `src/modules/estoque/appointment-stock.ts`, `appointment-stock.test.ts`

- [ ] **Step 1:** `types.ts` com `StockMovementType`, `AppointmentStockTransition`

- [ ] **Step 2:** Testes unitários da lógica pura (sem Supabase)

`appointment-stock.test.ts` — testar helpers:

```typescript
import { describe, expect, it } from "vitest";
import {
  shouldApplyAutoDeduction,
  shouldApplyAutoReversal,
  buildDeductionMovements,
} from "./appointment-stock";

describe("shouldApplyAutoDeduction", () => {
  it("true ao concluir com procedure_id e BOM", () => {
    expect(
      shouldApplyAutoDeduction({
        previousStatus: "pending",
        newStatus: "completed",
        procedureId: "proc-1",
        bomItems: [{ supply_id: "s1", quantity: 2 }],
        alreadyApplied: false,
        estoqueModuleEnabled: true,
      }),
    ).toBe(true);
  });

  it("false sem procedure_id", () => {
    expect(
      shouldApplyAutoDeduction({
        previousStatus: "pending",
        newStatus: "completed",
        procedureId: null,
        bomItems: [{ supply_id: "s1", quantity: 2 }],
        alreadyApplied: false,
        estoqueModuleEnabled: true,
      }),
    ).toBe(false);
  });
});

describe("buildDeductionMovements", () => {
  it("gera quantidades negativas por insumo", () => {
    expect(
      buildDeductionMovements("appt-1", [
        { supply_id: "s1", quantity: 2 },
        { supply_id: "s2", quantity: 0.5 },
      ]),
    ).toEqual([
      { supply_id: "s1", quantity: -2, movement_type: "auto_deduction" },
      { supply_id: "s2", quantity: -0.5, movement_type: "auto_deduction" },
    ]);
  });
});
```

- [ ] **Step 3:** Implementar funções puras + `applyStockForAppointmentStatusChange` async (usa admin client ou supabase server, transação lógica: ler appointment → BOM → inserir movements → atualizar supplies → appointment_stock_applied)

- [ ] **Step 4:** Retornar `{ applied: boolean, reversed: boolean }` para toast na agenda

- [ ] **Step 5:** Commit `feat(v4): baixa e estorno automatico estoque`

---

## Task 4: Server actions

**Files:**
- Create: `src/modules/estoque/actions.ts`

- [ ] **Step 1:** Helpers `requireEstoqueModule`, `assertWritableAdmin` (mesmo padrão procedimentos)

- [ ] **Step 2:** Implementar:

```typescript
export async function listStockSupplies() { /* supplies + alert level */ }
export async function countStockAlerts() { /* count low + critical */ }
export async function listSupplyMovements(supplyId: string, limit = 20) { /* ... */ }
export async function recordStockMovement(input: {
  supplyId: string;
  type: "inbound" | "outbound" | "adjustment";
  quantity: number;
  notes?: string;
}) { /* update quantity_on_hand + insert movement */ }

export async function updateSupplyMinQuantity(
  supplyId: string,
  minQuantity: number | null,
) { /* admin only, estoque page */ }
```

- [ ] **Step 3:** Demo mode: listas vazias, count 0

- [ ] **Step 4:** Commit `feat(v4): actions estoque movimentos e alertas`

---

## Task 5: UI `/estoque`

**Files:**
- Create: `src/app/(app)/estoque/page.tsx`
- Create: `src/modules/estoque/stock-list.tsx`
- Create: `src/modules/estoque/stock-movement-form.tsx`
- Create: `src/modules/estoque/movement-history-modal.tsx`
- Create: `src/modules/estoque/min-quantity-form.tsx`

- [ ] **Step 1:** `page.tsx` — redirect `/agenda` se módulo inativo; `listStockSupplies()`; `isAdmin = role === 'clinic_admin'`

- [ ] **Step 2:** `stock-list.tsx` — tabela com colunas nome, saldo, unidade, mínimo, badge (OK/Baixo/Crítico); admin: botões Entrada, Saída, Mínimo, Histórico

- [ ] **Step 3:** Modais usando `Modal` + `Button` de `@/components/ui`

- [ ] **Step 4:** Estado vazio: "Nenhum insumo cadastrado. Cadastre insumos em Procedimentos."

- [ ] **Step 5:** Commit `feat(v4): pagina estoque e movimentacoes UI`

---

## Task 6: Menu + badge

**Files:**
- Modify: `src/components/layout/nav-links.ts`, `filter-nav.ts`, `app-sidebar.tsx`, `bottom-nav.tsx`
- Create: `src/components/layout/stock-alert-badge.tsx`
- Modify: `src/lib/auth/routes.ts`, `routes.test.ts`

- [ ] **Step 1:** Adicionar link após Procedimentos:

```typescript
import { Package } from "lucide-react";
{ href: "/estoque", label: "Estoque", icon: Package },
```

- [ ] **Step 2:** `filter-nav.ts`: `"/estoque": "estoque"`

- [ ] **Step 3:** `stock-alert-badge.tsx` — client component que chama `countStockAlerts()` via prop do server layout ou fetch em `app-shell` passando `stockAlertCount` para sidebar/bottom-nav

- [ ] **Step 4:** Em `app-shell.tsx`, se `enabledModules.includes('estoque')`, chamar `countStockAlerts()` e passar para nav

- [ ] **Step 5:** Commit `feat(v4): menu estoque com badge alertas`

---

## Task 7: Integração agenda

**Files:**
- Modify: `src/modules/agenda/actions.ts`
- Modify: `src/modules/agenda/agenda-page-client.tsx`

- [ ] **Step 1:** Em `updateAppointmentStatus`, antes do update ler status atual; após update chamar:

```typescript
import { applyStockForAppointmentStatusChange } from "@/modules/estoque/appointment-stock";

const previous = appointment.status;
// ... update ...
const stockResult = await applyStockForAppointmentStatusChange(
  id,
  previous,
  status,
);
return { appointment: data, stockResult };
```

- [ ] **Step 2:** Em `upsertAppointment`, se status mudou para/de `completed`, mesma chamada

- [ ] **Step 3:** `agenda-page-client.tsx` — se `stockResult?.applied`, toast `"Estoque atualizado"`

- [ ] **Step 4:** `revalidatePath("/estoque")` após movimentação

- [ ] **Step 5:** `npm run test` — PASS

- [ ] **Step 6:** Commit `feat(v4): integracao estoque na agenda`

---

## Task 8: Export LGPD

**Files:**
- Modify: `src/lib/export/build-clinic-export.ts`, `build-clinic-export.test.ts`

- [ ] **Step 1:** `EXPORT_SCHEMA_VERSION = "1.4"`

- [ ] **Step 2:** Queries `stock_movements`, `appointment_stock_applied`; `supplies` já exportado — incluir `quantity_on_hand`, `min_quantity` no CSV

- [ ] **Step 3:** Manifest counts: `stock_movements`, `appointment_stock_applied`

- [ ] **Step 4:** Testes CSV movimentos

- [ ] **Step 5:** Commit `feat(v4): export LGPD stock movements`

---

## Task 9: Smoke

**Files:**
- Create: `scripts/smoke-estoque.ts`

- [ ] **Step 1:** Login smoke clinic; habilitar módulos `procedimentos` + `estoque` se necessário

- [ ] **Step 2:** Criar supply + BOM + entrada manual (saldo 10) + definir min_quantity 5

- [ ] **Step 3:** Criar appointment com procedure_id, status `completed` → verificar `auto_deduction` e saldo

- [ ] **Step 4:** Reabrir para `pending` → verificar `auto_reversal`

- [ ] **Step 5:** Export ZIP schema 1.4 com `stock_movements.json`

- [ ] **Step 6:** Cleanup; commit `test(v4): smoke estoque ledger e baixa`

---

## Task 10: Aceite spec

**Files:**
- Modify: `docs/superpowers/specs/2026-07-02-v4-estoque-design.md` §10
- Modify: `docs/superpowers/plans/2026-07-02-dental-seven-v4-estoque.md` (tasks [x])

- [ ] **Step 1:** Marcar critérios de aceite após smoke

- [ ] **Step 2:** Status spec → "Aprovada — aceite v4 concluído"

- [ ] **Step 3:** Commit `docs(v4): aceite spec estoque concluido`

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-07-02-dental-seven-v4-estoque.md`.

**Próximo:** executar Tasks 1–10 na branch `feat/v2`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute in this session with executing-plans checkpoints
