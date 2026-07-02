# Dental Seven v3 — Procedimentos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catálogo de procedimentos com preço/duração, BOM estruturado de insumos e vínculo opcional na agenda — módulo `procedimentos` no plano Completo.

**Architecture:** Migration `011` com `procedures`, `supplies`, `procedure_supply_items` e `appointments.procedure_id`; módulo único `src/modules/procedimentos/` com server actions + RLS; UI em `/procedimentos` (abas Procedimentos | Insumos); agenda com select catálogo + "Outro (texto livre)".

**Tech Stack:** Next.js 15, Supabase Postgres + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-v3-procedimentos-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`** (demo Vercel).

---

## Workflow Git

| Branch | Uso |
|--------|-----|
| `main` | Demo deployada na Vercel — **intocável** |
| `feat/v2` | v2 + v2.5 + v3.5 + v3 — commit a cada task concluída |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/011_procedures_catalog.sql` | Tabelas + RLS + `appointments.procedure_id` |
| `src/modules/procedimentos/types.ts` | Tipos Procedure, Supply, BomItem, form inputs |
| `src/modules/procedimentos/validation.ts` | Nome, preço, duração, quantidade BOM |
| `src/modules/procedimentos/validation.test.ts` | Vitest validação |
| `src/modules/procedimentos/price-utils.ts` | `centsToBrlInput` / `brlInputToCents` |
| `src/modules/procedimentos/price-utils.test.ts` | Vitest preço |
| `src/modules/procedimentos/agenda-procedure.ts` | `OTHER_PROCEDURE_VALUE`, resolver seleção agenda |
| `src/modules/procedimentos/agenda-procedure.test.ts` | Vitest agenda helpers |
| `src/modules/procedimentos/actions.ts` | CRUD procedures, supplies, BOM |
| `src/modules/procedimentos/procedure-list.tsx` | Tabela + modal procedimento |
| `src/modules/procedimentos/supply-list.tsx` | Tabela + modal insumo (admin) |
| `src/modules/procedimentos/bom-editor.tsx` | Editor BOM no modal procedimento |
| `src/modules/procedimentos/procedimentos-tabs.tsx` | Abas Procedimentos \| Insumos |
| `src/app/(app)/procedimentos/page.tsx` | Gate módulo + role |
| `src/components/layout/nav-links.ts` | Link Procedimentos |
| `src/components/layout/filter-nav.ts` | Gate `procedimentos` |
| `src/modules/agenda/types.ts` | `procedure_id` opcional no form |
| `src/modules/agenda/actions.ts` | Persistir `procedure_id` |
| `src/modules/agenda/appointment-modal.tsx` | Select catálogo + Outro |
| `src/app/(app)/agenda/page.tsx` | Carregar procedimentos ativos |
| `src/lib/export/build-clinic-export.ts` | Export schema 1.3 |
| `src/lib/export/build-clinic-export.test.ts` | Contagens export |
| `scripts/smoke-procedimentos.ts` | Smoke CRUD + agenda |

---

## Tasks

- [x] Task 1: Migration `011_procedures_catalog` + aplicar no Supabase remoto
- [x] Task 2: `validation.ts` + `price-utils.ts` + testes Vitest
- [x] Task 3: `agenda-procedure.ts` + testes Vitest
- [x] Task 4: Server actions — procedures e supplies
- [x] Task 5: Server actions — BOM
- [x] Task 6: Página `/procedimentos` + UI (tabs, listas, BOM)
- [x] Task 7: Menu Procedimentos (sidebar + bottom nav)
- [x] Task 8: Integração agenda — select catálogo + `procedure_id`
- [x] Task 9: Export LGPD schema 1.3
- [x] Task 10: Smoke `scripts/smoke-procedimentos.ts`
- [x] Task 11: Marcar spec §10 critérios de aceite + commit final da fase

---

## Task 1: Migration procedures catalog

**Files:**
- Create: `supabase/migrations/011_procedures_catalog.sql`

- [ ] **Step 1:** Criar migration com tabelas conforme spec §4

```sql
-- v3: procedures catalog + supplies BOM

create table procedures (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  base_price_cents integer not null default 0 check (base_price_cents >= 0),
  default_duration_min integer not null default 30 check (default_duration_min > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  unit_label text not null default 'un',
  unit_cost_cents integer check (unit_cost_cents is null or unit_cost_cents >= 0),
  sku text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table procedure_supply_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete restrict,
  quantity numeric(12, 3) not null check (quantity > 0),
  unique (procedure_id, supply_id)
);

alter table appointments
  add column if not exists procedure_id uuid references procedures(id) on delete set null;

create index idx_procedures_clinic_active_name
  on procedures(clinic_id, is_active, name);

create index idx_supplies_clinic_active_name
  on supplies(clinic_id, is_active, name);

create index idx_procedure_supply_items_procedure
  on procedure_supply_items(procedure_id);

create index idx_procedure_supply_items_clinic
  on procedure_supply_items(clinic_id);

create index idx_appointments_procedure_id
  on appointments(procedure_id)
  where procedure_id is not null;

alter table procedures enable row level security;
alter table supplies enable row level security;
alter table procedure_supply_items enable row level security;

create policy "procedures_clinic" on procedures for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "supplies_clinic" on supplies for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "procedure_supply_items_clinic" on procedure_supply_items for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
```

- [ ] **Step 2:** Aplicar via Supabase MCP `apply_migration` (nome: `procedures_catalog`)

- [ ] **Step 3:** Commit

```bash
git add supabase/migrations/011_procedures_catalog.sql
git commit -m "feat(v3): migration procedures catalog e BOM"
```

---

## Task 2: Validação e preço

**Files:**
- Create: `src/modules/procedimentos/validation.ts`, `validation.test.ts`
- Create: `src/modules/procedimentos/price-utils.ts`, `price-utils.test.ts`

- [ ] **Step 1:** Escrever testes falhando

`validation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  assertCatalogName,
  assertBomQuantity,
  assertDurationMin,
  assertPriceCents,
} from "./validation";

describe("assertCatalogName", () => {
  it("aceita nome com 2+ caracteres", () => {
    expect(() => assertCatalogName("  Limpeza  ")).not.toThrow();
  });

  it("rejeita nome curto", () => {
    expect(() => assertCatalogName("A")).toThrow(/mínimo 2/i);
  });
});

describe("assertPriceCents", () => {
  it("aceita zero", () => {
    expect(assertPriceCents(0)).toBe(0);
  });

  it("rejeita negativo", () => {
    expect(() => assertPriceCents(-1)).toThrow();
  });
});

describe("assertDurationMin", () => {
  it("aceita 30", () => {
    expect(assertDurationMin(30)).toBe(30);
  });

  it("rejeita zero", () => {
    expect(() => assertDurationMin(0)).toThrow();
  });
});

describe("assertBomQuantity", () => {
  it("aceita decimal com até 3 casas", () => {
    expect(assertBomQuantity(1.25)).toBe(1.25);
  });

  it("rejeita zero", () => {
    expect(() => assertBomQuantity(0)).toThrow();
  });
});
```

`price-utils.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { brlInputToCents, centsToBrlInput, formatBrlFromCents } from "./price-utils";

describe("price-utils", () => {
  it("converte BRL input para centavos", () => {
    expect(brlInputToCents("149,90")).toBe(14990);
    expect(brlInputToCents("0")).toBe(0);
  });

  it("converte centavos para input BRL", () => {
    expect(centsToBrlInput(14990)).toBe("149,90");
  });

  it("formata exibição", () => {
    expect(formatBrlFromCents(14990)).toMatch(/149/);
  });
});
```

- [ ] **Step 2:** Rodar testes — devem falhar

```bash
npm run test -- src/modules/procedimentos/validation.test.ts src/modules/procedimentos/price-utils.test.ts
```

Expected: FAIL — módulos não existem

- [ ] **Step 3:** Implementar

`validation.ts`:

```typescript
import { brlInputToCents } from "./price-utils";

const MIN_NAME_LENGTH = 2;

export function assertCatalogName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    throw new Error("Nome deve ter no mínimo 2 caracteres.");
  }
  return trimmed;
}

export function assertPriceCents(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Preço inválido. Use um valor em reais maior ou igual a zero.");
  }
  return value;
}

export function assertDurationMin(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Duração deve ser um número inteiro maior que zero.");
  }
  return value;
}

export function assertBomQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Quantidade deve ser maior que zero.");
  }
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - value) > 0.0001) {
    throw new Error("Quantidade aceita no máximo 3 casas decimais.");
  }
  return rounded;
}

export function parseOptionalCostCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cents = brlInputToCents(trimmed);
  return assertPriceCents(cents);
}
```

`price-utils.ts`:

```typescript
export function brlInputToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Valor em reais inválido.");
  }
  return Math.round(value * 100);
}

export function centsToBrlInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatBrlFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
```

- [ ] **Step 4:** Rodar testes — devem passar

```bash
npm run test -- src/modules/procedimentos/validation.test.ts src/modules/procedimentos/price-utils.test.ts
```

Expected: PASS

- [ ] **Step 5:** Commit

```bash
git add src/modules/procedimentos/validation.ts src/modules/procedimentos/validation.test.ts src/modules/procedimentos/price-utils.ts src/modules/procedimentos/price-utils.test.ts
git commit -m "feat(v3): validacao e helpers de preco procedimentos"
```

---

## Task 3: Helpers agenda

**Files:**
- Create: `src/modules/procedimentos/agenda-procedure.ts`, `agenda-procedure.test.ts`

- [ ] **Step 1:** Testes falhando

```typescript
import { describe, expect, it } from "vitest";
import {
  OTHER_PROCEDURE_VALUE,
  resolveAgendaProcedureFields,
} from "./agenda-procedure";

const catalogProcedure = {
  id: "proc-1",
  name: "Limpeza",
  default_duration_min: 45,
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
```

- [ ] **Step 2:** Implementar

```typescript
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
```

- [ ] **Step 3:** `npm run test -- src/modules/procedimentos/agenda-procedure.test.ts` — PASS

- [ ] **Step 4:** Commit `feat(v3): helpers selecao procedimento na agenda`

---

## Task 4: Actions procedures e supplies

**Files:**
- Create: `src/modules/procedimentos/types.ts`, `actions.ts`

- [ ] **Step 1:** `types.ts` com `ProcedureRow`, `SupplyRow`, `ProcedureBomRow`, form inputs

- [ ] **Step 2:** Implementar em `actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import {
  assertCatalogName,
  assertDurationMin,
  assertPriceCents,
} from "./validation";

async function requireProcedimentosModule() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Sessão inválida.");
  if (!ctx.enabledModules.includes("procedimentos")) {
    throw new Error("Módulo Procedimentos não está ativo para esta clínica.");
  }
  return ctx;
}

async function assertWritableAdmin() {
  const ctx = await requireProcedimentosModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode alterar o catálogo.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
  return ctx;
}

export async function listProcedures(options?: { activeOnly?: boolean }) {
  if (isDemoMockDataEnabled()) return [];

  await requireProcedimentosModule();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  let query = supabase
    .from("procedures")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listSupplies(options?: { activeOnly?: boolean }) {
  if (isDemoMockDataEnabled()) return [];

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  let query = supabase
    .from("supplies")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProcedure(input: {
  name: string;
  base_price_cents: number;
  default_duration_min: number;
}) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .insert({
      clinic_id: clinicId,
      name: assertCatalogName(input.name),
      base_price_cents: assertPriceCents(input.base_price_cents),
      default_duration_min: assertDurationMin(input.default_duration_min),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  revalidatePath("/agenda");
  return data;
}

// updateProcedure, setProcedureActive, createSupply, updateSupply, setSupplyActive — mesmo padrão
```

- [ ] **Step 3:** Completar `updateProcedure`, `setProcedureActive`, `createSupply`, `updateSupply`, `setSupplyActive` com validação e `updated_at`

- [ ] **Step 4:** Commit `feat(v3): actions CRUD procedimentos e insumos`

---

## Task 5: Actions BOM

**Files:**
- Modify: `src/modules/procedimentos/actions.ts`

- [ ] **Step 1:** `listProcedureBom(procedureId)` — join `supplies` via `procedure_supply_items`

- [ ] **Step 2:** `upsertProcedureBomItem({ procedureId, supplyId, quantity })` — admin only, `assertBomQuantity`, `on conflict (procedure_id, supply_id) do update`

- [ ] **Step 3:** `removeProcedureBomItem(itemId)` — admin only

- [ ] **Step 4:** Commit `feat(v3): actions BOM procedimentos`

---

## Task 6: UI `/procedimentos`

**Files:**
- Create: `src/app/(app)/procedimentos/page.tsx`
- Create: `src/modules/procedimentos/procedimentos-tabs.tsx`
- Create: `src/modules/procedimentos/procedure-list.tsx`
- Create: `src/modules/procedimentos/supply-list.tsx`
- Create: `src/modules/procedimentos/bom-editor.tsx`

- [ ] **Step 1:** `page.tsx` — `getAuthContext`, redirect se módulo inativo; passar `isAdmin = role === 'clinic_admin'`; carregar `listProcedures()` e, se admin, `listSupplies()`

- [ ] **Step 2:** `procedimentos-tabs.tsx` — admin vê duas abas; dentista só conteúdo de Procedimentos

- [ ] **Step 3:** `procedure-list.tsx` — tabela (nome, preço formatado, duração, status); admin: botão Novo/Editar abre modal com campos + `bom-editor.tsx`

- [ ] **Step 4:** `supply-list.tsx` — admin only; modal com nome, unit_label (select sugestões), custo opcional, SKU, ativo

- [ ] **Step 5:** `bom-editor.tsx` — select insumo ativo + input quantidade + lista itens com remover

- [ ] **Step 6:** Estado vazio conforme spec §7

- [ ] **Step 7:** Commit `feat(v3): pagina procedimentos e CRUD UI`

---

## Task 7: Menu

**Files:**
- Modify: `src/components/layout/nav-links.ts`
- Modify: `src/components/layout/filter-nav.ts`
- Modify: `src/lib/auth/routes.test.ts` (se existir teste de paths)

- [ ] **Step 1:** Em `nav-links.ts`, após Pacientes:

```typescript
import { Calendar, ClipboardList, MessageCircle, Settings, Users } from "lucide-react";

// ...
{ href: "/procedimentos", label: "Procedimentos", icon: ClipboardList },
```

- [ ] **Step 2:** Em `filter-nav.ts`:

```typescript
const MODULE_BY_HREF: Record<string, string> = {
  "/agenda": "agenda",
  "/pacientes": "pacientes",
  "/procedimentos": "procedimentos",
  "/whatsapp": "whatsapp",
};
```

- [ ] **Step 3:** Verificar `/procedimentos` em `isClinicAppPath` se necessário

- [ ] **Step 4:** Commit `feat(v3): menu procedimentos`

---

## Task 8: Integração agenda

**Files:**
- Modify: `src/modules/agenda/types.ts`
- Modify: `src/modules/agenda/actions.ts`
- Modify: `src/modules/agenda/appointment-modal.tsx`
- Modify: `src/app/(app)/agenda/page.tsx`

- [ ] **Step 1:** Em `types.ts`, adicionar ao `AppointmentFormInput`:

```typescript
procedure_id?: string | null;
```

- [ ] **Step 2:** Em `actions.ts` `upsertAppointment`, incluir no payload:

```typescript
procedure_id: input.procedure_id ?? null,
```

- [ ] **Step 3:** Em `agenda/page.tsx`, se `enabledModules.includes('procedimentos')`, chamar `listProcedures({ activeOnly: true })` e passar para o client da agenda

- [ ] **Step 4:** Em `appointment-modal.tsx`:
  - Prop `catalogProcedures?: AgendaCatalogProcedure[]`
  - Se catálogo presente: `<select>` com opções + `OTHER_PROCEDURE_VALUE`
  - Ao mudar seleção catálogo: aplicar `resolveAgendaProcedureFields` → atualizar `procedure_label`, `duration_min`, `procedure_id`
  - Se Outro: mostrar `<Input>` texto livre; `procedure_id = null`
  - Sem catálogo: manter input texto atual

- [ ] **Step 5:** Atualizar `appointment-modal.test.ts` se existir — caso Outro grava `procedure_id` null

- [ ] **Step 6:** `npm run test` — todos passando

- [ ] **Step 7:** Commit `feat(v3): select procedimento na agenda`

---

## Task 9: Export LGPD

**Files:**
- Modify: `src/lib/export/build-clinic-export.ts`
- Modify: `src/lib/export/build-clinic-export.test.ts`

- [ ] **Step 1:** `EXPORT_SCHEMA_VERSION = "1.3"`

- [ ] **Step 2:** Query paralela:

```typescript
admin.from("procedures").select("*").eq("clinic_id", clinicId),
admin.from("supplies").select("*").eq("clinic_id", clinicId),
admin.from("procedure_supply_items").select("*").eq("clinic_id", clinicId),
```

- [ ] **Step 3:** Adicionar JSON/CSV das 3 tabelas; `appointments.csv` incluir coluna `procedure_id`

- [ ] **Step 4:** Manifest counts: `procedures`, `supplies`, `procedure_supply_items`

- [ ] **Step 5:** Atualizar testes export

- [ ] **Step 6:** Commit `feat(v3): export LGPD procedures e BOM`

---

## Task 10: Smoke

**Files:**
- Create: `scripts/smoke-procedimentos.ts`

- [ ] **Step 1:** Script com login `v2smoke-full-20260702@test.dr7.app` / `demo2026v2`:
  1. Verificar módulo `procedimentos` enabled
  2. Insert procedure "Limpeza Smoke v3"
  3. Insert supply "Luva" + BOM qty 2
  4. Listar e validar
  5. Criar appointment com `procedure_id` + verificar `procedure_label`
  6. Cleanup (delete appointment test, BOM, supply, procedure) ou usar IDs random

- [ ] **Step 2:** Rodar

```bash
npx tsx scripts/smoke-procedimentos.ts
```

Expected: linhas `OK` para cada etapa

- [ ] **Step 3:** Commit `test(v3): smoke procedimentos catalogo e agenda`

---

## Task 11: Aceite spec

**Files:**
- Modify: `docs/superpowers/specs/2026-07-02-v3-procedimentos-design.md` §10

- [ ] **Step 1:** Marcar critérios de aceite `[x]` após smoke e testes

- [ ] **Step 2:** Atualizar Status para "Aprovada — aceite v3 concluído" e changelog

- [ ] **Step 3:** Commit `docs(v3): aceite spec procedimentos concluido`

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-07-02-dental-seven-v3-procedimentos.md`.

**Status:** v3 concluída (Tasks 1–11) na branch `feat/v2`.

**Próximo:** v4 Estoque — ver roadmap em `2026-06-11-dental-seven-mvp-design.md`
