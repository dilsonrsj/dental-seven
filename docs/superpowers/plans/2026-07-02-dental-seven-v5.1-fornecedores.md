# Dental Seven v5.1 — Fornecedores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cadastro de fornecedores, vínculo preferencial insumo→fornecedor e botão **Pedir reposição** via WhatsApp no alerta de estoque — módulo `fornecedores` no plano Completo (MicroSaaS enxuto).

**Architecture:** Migration `014` com tabela `suppliers` e `supplies.preferred_supplier_id`; módulo `src/modules/fornecedores/`; integração leve em `stock-list.tsx` (sem hook na agenda); export LGPD schema 1.6.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-v5.1-fornecedores-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`** (demo Vercel).

---

## Workflow Git

| Branch | Uso |
|--------|-----|
| `main` | Demo deployada na Vercel — **intocável** |
| `feat/v2` | v2 … v5.1 — commit a cada task concluída |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/014_suppliers.sql` | Tabela suppliers + FK em supplies |
| `src/modules/fornecedores/types.ts` | SupplierRow, forms, SupplyLinkRow |
| `src/modules/fornecedores/validation.ts` | Nome, telefone, e-mail |
| `src/modules/fornecedores/validation.test.ts` | Vitest |
| `src/modules/fornecedores/whatsapp-reorder.ts` | Phone normalize + wa.me URL + mensagem |
| `src/modules/fornecedores/whatsapp-reorder.test.ts` | Vitest |
| `src/modules/fornecedores/actions.ts` | CRUD suppliers, update preferred link |
| `src/modules/fornecedores/supplier-list.tsx` | Lista + modal CRUD |
| `src/modules/fornecedores/supplier-form.tsx` | Modal create/edit |
| `src/modules/fornecedores/supply-link-table.tsx` | Vínculo insumo→fornecedor |
| `src/app/(app)/fornecedores/page.tsx` | Gate módulo + admin |
| `src/modules/procedimentos/types.ts` | `preferred_supplier_id` em SupplyRow |
| `src/modules/estoque/types.ts` | `PreferredSupplierRef` em StockSupplyRow |
| `src/modules/estoque/actions.ts` | Join supplier no listStockSupplies |
| `src/modules/estoque/stock-list.tsx` | Botão Pedir reposição |
| `src/app/(app)/estoque/page.tsx` | Passar `fornecedoresEnabled`, `isAdmin` |
| `src/components/layout/nav-links.ts` | Link Fornecedores |
| `src/components/layout/filter-nav.ts` | Gate `fornecedores` |
| `src/lib/auth/routes.ts` | Prefix `/fornecedores` |
| `src/lib/export/build-clinic-export.ts` | Export schema 1.6 |
| `scripts/smoke-fornecedores.ts` | Smoke CRUD + WhatsApp + export |

---

## Tasks

- [ ] Task 1: Migration `014_suppliers` + aplicar Supabase
- [ ] Task 2: `validation.ts` + `whatsapp-reorder.ts` + testes Vitest
- [ ] Task 3: Server actions — CRUD suppliers + vínculo insumo
- [ ] Task 4: UI `/fornecedores` (lista + vínculos)
- [ ] Task 5: Menu Fornecedores
- [ ] Task 6: Integração estoque — botão Pedir reposição
- [ ] Task 7: Export LGPD schema 1.6
- [ ] Task 8: Smoke `scripts/smoke-fornecedores.ts`
- [ ] Task 9: Marcar spec §10 aceite + commit final da fase

---

## Task 1: Migration suppliers

**Files:**
- Create: `supabase/migrations/014_suppliers.sql`

- [ ] **Step 1:** Criar migration conforme spec §4

```sql
-- v5.1: suppliers + preferred link on supplies

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table supplies
  add column preferred_supplier_id uuid
    references suppliers(id) on delete set null;

create index idx_suppliers_clinic_active_name
  on suppliers(clinic_id, is_active, name);

create index idx_supplies_preferred_supplier
  on supplies(preferred_supplier_id)
  where preferred_supplier_id is not null;

alter table suppliers enable row level security;

create policy "suppliers_clinic" on suppliers for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
```

- [ ] **Step 2:** Aplicar via Supabase MCP `apply_migration` (nome: `suppliers`)

- [ ] **Step 3:** Commit `feat(v5.1): migration suppliers`

---

## Task 2: Validação e WhatsApp reorder

**Files:**
- Create: `src/modules/fornecedores/types.ts`
- Create: `src/modules/fornecedores/validation.ts`, `validation.test.ts`
- Create: `src/modules/fornecedores/whatsapp-reorder.ts`, `whatsapp-reorder.test.ts`

- [ ] **Step 1:** Testes falhando

`validation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  assertSupplierEmail,
  assertSupplierName,
  assertSupplierPhone,
} from "./validation";

describe("validation", () => {
  it("rejeita nome curto", () => {
    expect(() => assertSupplierName("A")).toThrow();
  });

  it("aceita telefone com dígitos", () => {
    expect(assertSupplierPhone("(11) 98765-4321")).toBe("11987654321");
  });

  it("aceita e-mail vazio", () => {
    expect(assertSupplierEmail("")).toBeNull();
  });
});
```

`whatsapp-reorder.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  buildReorderWhatsAppUrl,
  buildReorderMessage,
  normalizePhoneForWhatsApp,
} from "./whatsapp-reorder";

describe("whatsapp-reorder", () => {
  it("prefixa 55 em número local", () => {
    expect(normalizePhoneForWhatsApp("11987654321")).toBe("5511987654321");
  });

  it("monta mensagem com saldo e mínimo", () => {
    const msg = buildReorderMessage({
      supplyName: "Luva",
      quantityOnHand: 3,
      unitLabel: "par",
      minQuantity: 10,
    });
    expect(msg).toContain("Luva");
    expect(msg).toContain("3");
    expect(msg).toContain("10");
  });

  it("monta URL wa.me", () => {
    const url = buildReorderWhatsAppUrl({
      phone: "11987654321",
      supplyName: "Luva",
      quantityOnHand: 3,
      unitLabel: "par",
      minQuantity: 10,
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/);
  });
});
```

- [ ] **Step 2:** Implementar

`validation.ts` — reutilizar padrão `assertCatalogName` de procedimentos para nome; telefone opcional (só dígitos); e-mail opcional (regex simples ou null).

`whatsapp-reorder.ts`:

```typescript
export function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

export function buildReorderMessage(input: {
  supplyName: string;
  quantityOnHand: number;
  unitLabel: string;
  minQuantity: number | null;
}): string {
  const min = input.minQuantity ?? 0;
  return `Olá! Preciso repor o insumo ${input.supplyName}. Saldo atual: ${input.quantityOnHand} ${input.unitLabel}. Mínimo: ${min}.`;
}

export function buildReorderWhatsAppUrl(input: {
  phone: string;
  supplyName: string;
  quantityOnHand: number;
  unitLabel: string;
  minQuantity: number | null;
}): string | null {
  const normalized = normalizePhoneForWhatsApp(input.phone);
  if (!normalized) return null;
  const text = encodeURIComponent(buildReorderMessage(input));
  return `https://wa.me/${normalized}?text=${text}`;
}
```

- [ ] **Step 3:** `npm run test -- src/modules/fornecedores/` — PASS

- [ ] **Step 4:** Commit `feat(v5.1): validacao e whatsapp reorder fornecedores`

---

## Task 3: Server actions

**Files:**
- Create: `src/modules/fornecedores/actions.ts`
- Modify: `src/modules/procedimentos/types.ts` — add `preferred_supplier_id: string | null` to `SupplyRow`

- [ ] **Step 1:** `requireFornecedoresModule`, `assertWritableAdmin` (espelhar `financeiro/actions.ts`)

- [ ] **Step 2:** Implementar:

```typescript
export async function listSuppliers(): Promise<SupplierRow[]>
export async function createSupplier(input: SupplierFormInput): Promise<SupplierRow>
export async function updateSupplier(id: string, input: SupplierFormInput): Promise<SupplierRow>
export async function setSupplierActive(id: string, isActive: boolean): Promise<SupplierRow>
export async function listSuppliesForLinking(): Promise<SupplyLinkRow[]>
export async function updateSupplyPreferredSupplier(
  supplyId: string,
  preferredSupplierId: string | null,
): Promise<void>
```

Regras:
- `updateSupplyPreferredSupplier`: validar supply e supplier na mesma clínica; supplier deve estar `is_active` (ou null para limpar)
- Demo: listas vazias; writes lançam erro padrão
- `revalidatePath('/fornecedores')` e `revalidatePath('/estoque')` após writes

- [ ] **Step 3:** Commit `feat(v5.1): actions fornecedores crud e vinculo`

---

## Task 4: UI `/fornecedores`

**Files:**
- Create: `src/app/(app)/fornecedores/page.tsx`
- Create: `src/modules/fornecedores/supplier-list.tsx`
- Create: `src/modules/fornecedores/supplier-form.tsx`
- Create: `src/modules/fornecedores/supply-link-table.tsx`

- [ ] **Step 1:** `page.tsx` — gate `fornecedores`; redirect `/agenda` se inativo; redirect `/agenda` se role !== `clinic_admin`

- [ ] **Step 2:** `supplier-list.tsx` — tabela fornecedores + botão Novo fornecedor + modal form

- [ ] **Step 3:** `supply-link-table.tsx` — insumos ativos + select fornecedor (opção “Nenhum” + ativos)

- [ ] **Step 4:** Commit `feat(v5.1): pagina fornecedores crud e vinculos`

---

## Task 5: Menu

**Files:**
- Modify: `nav-links.ts`, `filter-nav.ts`, `routes.ts`, `routes.test.ts`

- [ ] **Step 1:** Após Financeiro:

```typescript
import { Truck } from "lucide-react";
{ href: "/fornecedores", label: "Fornecedores", icon: Truck },
```

- [ ] **Step 2:** `filter-nav.ts`: `"/fornecedores": "fornecedores"`

- [ ] **Step 3:** Commit `feat(v5.1): menu fornecedores`

---

## Task 6: Integração estoque

**Files:**
- Modify: `src/modules/estoque/types.ts`
- Modify: `src/modules/estoque/actions.ts`
- Modify: `src/modules/estoque/stock-list.tsx`
- Modify: `src/app/(app)/estoque/page.tsx`

- [ ] **Step 1:** Estender `StockSupplyRow`:

```typescript
export type PreferredSupplierRef = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type StockSupplyRow = SupplyRow & {
  quantity_on_hand: number;
  min_quantity: number | null;
  alert_level: StockAlertLevel;
  preferred_supplier: PreferredSupplierRef | null;
};
```

- [ ] **Step 2:** Em `listStockSupplies`, quando módulo `fornecedores` ativo, select join:

```typescript
.select(`
  *,
  preferred_supplier:suppliers!supplies_preferred_supplier_id_fkey(id, name, phone, email)
`)
```

Mapear nested relation para `preferred_supplier`.

- [ ] **Step 3:** Em `stock-list.tsx` — props `fornecedoresEnabled`, `isAdmin`:

```typescript
{fornecedoresEnabled && isAdmin && isStockAlert(supply.alert_level) && (
  supply.preferred_supplier?.phone ? (
    <Button asChild variant="outline">
      <a href={buildReorderWhatsAppUrl({...})} target="_blank" rel="noopener noreferrer">
        Pedir reposição
      </a>
    </Button>
  ) : (
    <span className="text-xs text-muted-foreground" title="Cadastre telefone do fornecedor">
      {supply.preferred_supplier?.email ?? "Sem fornecedor"}
    </span>
  )
)}
```

Import `buildReorderWhatsAppUrl` from `@/modules/fornecedores/whatsapp-reorder`.

- [ ] **Step 4:** `estoque/page.tsx` passar flags de `getAuthContext()`

- [ ] **Step 5:** Commit `feat(v5.1): botao pedir reposicao no estoque`

---

## Task 7: Export LGPD

**Files:**
- Modify: `build-clinic-export.ts`, `build-clinic-export.test.ts`
- Modify: `scripts/smoke-financeiro.ts`, `scripts/smoke-estoque.ts` — schemaVersion `1.6` se checarem versão

- [ ] **Step 1:** `EXPORT_SCHEMA_VERSION = "1.6"`

- [ ] **Step 2:** Query `suppliers`; adicionar `suppliers.json`, `suppliers.csv`; coluna `preferred_supplier_id` em `supplies.csv`

- [ ] **Step 3:** Manifest count `suppliers`

- [ ] **Step 4:** Commit `feat(v5.1): export LGPD suppliers schema 1.6`

---

## Task 8: Smoke

**Files:**
- Create: `scripts/smoke-fornecedores.ts`

- [ ] **Step 1:** Login smoke clinic; habilitar `fornecedores` + `procedimentos` + `estoque`

- [ ] **Step 2:** Criar supplier com telefone; criar insumo com min_quantity; vincular preferred_supplier_id

- [ ] **Step 3:** Verificar `buildReorderWhatsAppUrl` output; simular alerta (saldo abaixo do mínimo)

- [ ] **Step 4:** Export 1.6 com `suppliers.json`

- [ ] **Step 5:** Cleanup; commit `test(v5.1): smoke fornecedores vinculo e whatsapp`

---

## Task 9: Aceite spec

- [ ] **Step 1:** Marcar critérios §10 na spec
- [ ] **Step 2:** Marcar tasks [x] no plano
- [ ] **Step 3:** Commit `docs(v5.1): aceite spec fornecedores concluido`

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-07-02-dental-seven-v5.1-fornecedores.md`.

**Próximo:** executar Tasks 1–9 na branch `feat/v2`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute in this session with executing-plans checkpoints
