# Dental Seven v8.0 — Convênios (Fundação) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulo `convenios` com cadastro operadora/plano, vínculo paciente, preços por procedimento, pagamento convênio na agenda, guias manuais com status/glosa e recebível financeiro integrado.

**Architecture:** Migration `024_insurance_convenios.sql` com 5 tabelas + alterações em `appointments` e enum financeiro; módulo `src/modules/convenios/` espelhando `fornecedores/`; hooks em agenda (`appointment-finance.ts`) e card em financeiro.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS, Vitest, shadcn/ui tabs.

**Spec:** `docs/superpowers/specs/2026-07-10-convenios-planos-design.md` (aprovada 2026-07-10)

**Branch:** `feat/v2` apenas — **não mergear em `main`**.

**Quando executar:** fila pós-beta **item 7**, após anamnese (item 6) e deploy beta (item 5). **Não antecipar** durante pré-beta.

**Execução:** subagent-driven (`subagent-driven-development`) — uma task por subagent, revisão entre tasks.

---

## Workflow Git

| Branch | Uso |
|--------|-----|
| `main` | Demo Vercel — intocável |
| `feat/v2` | v8.0 convênios — commit a cada task |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/024_insurance_convenios.sql` | Schema convênios + appointments + enum |
| `src/lib/billing/plans.ts` | `ModuleKey` `convenios`, matriz Inteligente+ |
| `src/lib/billing/plans.test.ts` | Testes matriz |
| `src/lib/admin/actions.ts` | `ALL_MODULE_KEYS` |
| `src/modules/convenios/types.ts` | Rows, forms, status labels |
| `src/modules/convenios/validation.ts` | Validação carrier/plan/enrollment/claim |
| `src/modules/convenios/validation.test.ts` | Vitest |
| `src/modules/convenios/claim-status.ts` | Labels PT + transições permitidas |
| `src/modules/convenios/claim-status.test.ts` | Vitest |
| `src/modules/convenios/actions.ts` | CRUD carriers, plans, prices, claims, enrollment |
| `src/modules/convenios/carrier-list.tsx` | Tab operadoras |
| `src/modules/convenios/price-table.tsx` | Tab preços |
| `src/modules/convenios/claim-list.tsx` | Tab guias + glosas |
| `src/modules/convenios/convenios-page-client.tsx` | Tabs shell |
| `src/app/(app)/convenios/page.tsx` | Gate módulo + admin parcial |
| `src/modules/pacientes/patient-insurance-section.tsx` | Enrollment na ficha |
| `src/modules/pacientes/actions.ts` | savePatientInsurance |
| `src/modules/agenda/appointment-modal.tsx` | payment_source + plan select |
| `src/modules/agenda/actions.ts` | Persistir campos convênio |
| `src/modules/agenda/types.ts` | Campos novos |
| `src/modules/financeiro/appointment-finance.ts` | insurance_receivable |
| `src/modules/financeiro/types.ts` | Novos entry types |
| `src/modules/financeiro/finance-dashboard.tsx` | Card recebíveis convênio |
| `src/components/layout/nav-links.ts` | Link Convênios |
| `src/components/layout/filter-nav.ts` | Gate `convenios` |
| `src/lib/export/build-clinic-export.ts` | Export schema 1.7 |
| `scripts/smoke-convenios.ts` | Smoke E2E |

---

## Tasks

- [x] Task 1: Migration `025_insurance_convenios` (024 já usado pela anamnese)
- [x] Task 2: Module key + billing matrix
- [x] Task 3: Types, validation, claim-status + testes
- [x] Task 4: Server actions CRUD convênios
- [x] Task 5: UI `/convenios` (tabs)
- [x] Task 6: Integração paciente (enrollment)
- [x] Task 7: Integração agenda (payment_source)
- [x] Task 8: Integração financeiro (recebível base caixa + card)
- [x] Task 9: Menu + export LGPD + verificação (test+build)
- [x] Task 10: Atualizar spec §12 + GUIA-MASTER

**Status:** ✅ Implementado em `feat/v2` (2026-07-10). 242 testes + build verdes.

## Desvios de arquitetura (vs. plano original)

1. **Migration numerada `025`** — `024` foi usada pela anamnese v3.7 no mesmo lote.
2. **Sem alterar o enum `financial_entry_type`.** O plano previa `insurance_receivable` / `insurance_receivable_reversal`. Adotado modelo **base caixa**: o recebível vive em `insurance_claims` (guias em aberto). Ao marcar a guia como paga (`markClaimPaid`), gera-se um lançamento `revenue` normal no ledger. Motivos: evita risco do `ALTER TYPE ADD VALUE`, mantém o DRE/caixa limpo (só reconhece receita realizada) e não infla o ledger com valores ainda não recebidos.
3. **Financeiro:** `applyFinanceForAppointmentStatusChange` agora **pula** a receita automática quando `payment_source = 'insurance'`; a guia é criada por `createClaimForAppointment` ao concluir a consulta. Card "A receber de convênios" renderizado no server em `/financeiro` (admin) + card equivalente na aba Guias de `/convenios`.
4. **Enrollment** implementado como módulo `convenios` (`patient-insurance-section.tsx` renderizado em `pacientes/[id]/page.tsx`), não em `pacientes/actions.ts`.
5. **Smoke script não criado** — verificação feita via `npm run test` (242) + `npm run build`.

---

## Task 1: Migration insurance convenios

**Files:**
- Create: `supabase/migrations/024_insurance_convenios.sql`

- [ ] **Step 1:** Criar migration conforme spec §6

```sql
-- v8.0: insurance carriers, plans, enrollments, prices, claims

create type insurance_claim_status as enum (
  'draft',
  'awaiting_auth',
  'authorized',
  'submitted',
  'paid',
  'partial_glosa',
  'glosa',
  'appealing'
);

create table insurance_carriers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  ans_registry text,
  provider_code text,
  portal_url text,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table insurance_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  carrier_id uuid not null references insurance_carriers(id) on delete cascade,
  name text not null,
  requires_pre_auth boolean not null default false,
  coverage_notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, carrier_id, name)
);

create table patient_insurance_enrollments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  plan_id uuid not null references insurance_plans(id) on delete restrict,
  card_number text not null,
  holder_name text,
  valid_until date,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table insurance_procedure_prices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  plan_id uuid not null references insurance_plans(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  tuss_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, procedure_id)
);

create table insurance_claims (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete restrict,
  plan_id uuid not null references insurance_plans(id) on delete restrict,
  appointment_id uuid references appointments(id) on delete set null,
  procedure_id uuid references procedures(id) on delete set null,
  status insurance_claim_status not null default 'draft',
  auth_password text,
  submitted_amount_cents integer not null check (submitted_amount_cents >= 0),
  paid_amount_cents integer check (paid_amount_cents >= 0),
  glosa_reason text not null default '',
  glosa_amount_cents integer check (glosa_amount_cents >= 0),
  submitted_at date,
  paid_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table appointments
  add column payment_source text not null default 'particular'
    check (payment_source in ('particular', 'insurance')),
  add column insurance_plan_id uuid references insurance_plans(id) on delete set null;

alter type financial_entry_type add value if not exists 'insurance_receivable';
alter type financial_entry_type add value if not exists 'insurance_receivable_reversal';

create index idx_insurance_carriers_clinic on insurance_carriers(clinic_id, is_active);
create index idx_insurance_plans_carrier on insurance_plans(carrier_id, is_active);
create index idx_patient_enrollments_patient on patient_insurance_enrollments(patient_id);
create index idx_insurance_claims_clinic_status on insurance_claims(clinic_id, status);

alter table insurance_carriers enable row level security;
alter table insurance_plans enable row level security;
alter table patient_insurance_enrollments enable row level security;
alter table insurance_procedure_prices enable row level security;
alter table insurance_claims enable row level security;

create policy "insurance_carriers_clinic" on insurance_carriers for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "insurance_plans_clinic" on insurance_plans for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "patient_insurance_enrollments_clinic" on patient_insurance_enrollments for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "insurance_procedure_prices_clinic" on insurance_procedure_prices for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "insurance_claims_clinic" on insurance_claims for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
```

- [ ] **Step 2:** Aplicar via Supabase MCP `apply_migration` (nome: `insurance_convenios`)

- [ ] **Step 3:** Commit `feat(v8): migration insurance convenios`

---

## Task 2: Module key + billing matrix

**Files:**
- Modify: `src/lib/billing/plans.ts`
- Modify: `src/lib/billing/plans.test.ts`
- Modify: `src/lib/admin/actions.ts`
- Modify: `src/lib/auth/actions.ts` (signup module list se existir)

- [ ] **Step 1:** Adicionar `"convenios"` a `ModuleKey` e `PLAN_MODULES`:

```typescript
// Inteligente e Completo: true
// Essencial e Conecta: false
convenios: { essencial: false, conecta: false, inteligente: true, completo: true },
```

- [ ] **Step 2:** Atualizar `ALL_MODULE_KEYS` em admin actions

- [ ] **Step 3:** Teste em `plans.test.ts`:

```typescript
it("convenios só Inteligente e Completo", () => {
  expect(defaultModuleEnabled("essencial", "convenios")).toBe(false);
  expect(defaultModuleEnabled("inteligente", "convenios")).toBe(true);
  expect(defaultModuleEnabled("completo", "convenios")).toBe(true);
});
```

- [ ] **Step 4:** Run `npm run test -- plans.test.ts` — PASS

- [ ] **Step 5:** Commit `feat(v8): gate convenios module in billing`

---

## Task 3: Types, validation, claim-status

**Files:**
- Create: `src/modules/convenios/types.ts`
- Create: `src/modules/convenios/validation.ts`, `validation.test.ts`
- Create: `src/modules/convenios/claim-status.ts`, `claim-status.test.ts`

- [ ] **Step 1:** `validation.test.ts` falhando:

```typescript
import { describe, expect, it } from "vitest";
import {
  assertCardNumber,
  assertCarrierName,
  assertClaimAmount,
} from "./validation";

describe("convenios validation", () => {
  it("rejeita nome operadora curto", () => {
    expect(() => assertCarrierName("X")).toThrow();
  });

  it("exige carteirinha", () => {
    expect(() => assertCardNumber("")).toThrow();
  });

  it("rejeita valor negativo", () => {
    expect(() => assertClaimAmount(-1)).toThrow();
  });
});
```

- [ ] **Step 2:** Implementar `validation.ts`

- [ ] **Step 3:** `claim-status.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { canTransitionClaimStatus, CLAIM_STATUS_LABELS } from "./claim-status";

describe("claim status", () => {
  it("draft pode ir para awaiting_auth", () => {
    expect(canTransitionClaimStatus("draft", "awaiting_auth")).toBe(true);
  });

  it("paid não volta para draft", () => {
    expect(canTransitionClaimStatus("paid", "draft")).toBe(false);
  });

  it("tem label PT para glosa", () => {
    expect(CLAIM_STATUS_LABELS.glosa).toBe("Glosada");
  });
});
```

- [ ] **Step 4:** Implementar `claim-status.ts` e `types.ts`

- [ ] **Step 5:** Run `npm run test -- src/modules/convenios` — PASS

- [ ] **Step 6:** Commit `feat(v8): convenios validation and claim status`

---

## Task 4: Server actions

**Files:**
- Create: `src/modules/convenios/actions.ts`

- [ ] **Step 1:** `requireConveniosModule()` — padrão fornecedores; dentistas lançam erro em writes admin-only

- [ ] **Step 2:** Actions:
  - `listCarriers`, `createCarrier`, `updateCarrier`, `deactivateCarrier`
  - `createPlan`, `updatePlan`
  - `upsertProcedurePrice`, `listProcedurePrices`
  - `savePatientEnrollment`, `listPatientEnrollments`
  - `listClaims`, `createClaimFromAppointment`, `updateClaimStatus`
  - `markClaimPaid` (atualiza financeiro)

- [ ] **Step 3:** Validar cross-clinic em FKs (plan pertence à clínica)

- [ ] **Step 4:** Commit `feat(v8): convenios server actions`

---

## Task 5: UI `/convenios`

**Files:**
- Create: `src/modules/convenios/convenios-page-client.tsx`
- Create: `src/modules/convenios/carrier-list.tsx`
- Create: `src/modules/convenios/price-table.tsx`
- Create: `src/modules/convenios/claim-list.tsx`
- Create: `src/app/(app)/convenios/page.tsx`

- [ ] **Step 1:** Page gate:

```typescript
export default async function ConveniosPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("convenios")) redirect("/agenda");
  if (ctx.profile.role !== "clinic_admin") redirect("/agenda");
  // load data...
}
```

- [ ] **Step 2:** Tabs: Operadoras | Preços | Guias | Glosas (filtro)

- [ ] **Step 3:** Empty states com copy orientativa

- [ ] **Step 4:** Commit `feat(v8): convenios admin UI`

---

## Task 6: Integração paciente

**Files:**
- Create: `src/modules/pacientes/patient-insurance-section.tsx`
- Modify: `src/modules/pacientes/patient-detail.tsx` (ou equivalente)
- Modify: `src/modules/pacientes/actions.ts`

- [ ] **Step 1:** Seção visível se `enabledModules.includes("convenios")`

- [ ] **Step 2:** Form: select plano, carteirinha, titular, validade

- [ ] **Step 3:** Dentista e admin podem salvar enrollment; listagem read-only para dentist

- [ ] **Step 4:** Commit `feat(v8): patient insurance enrollment`

---

## Task 7: Integração agenda

**Files:**
- Modify: `src/modules/agenda/appointment-modal.tsx`
- Modify: `src/modules/agenda/actions.ts`
- Modify: `src/modules/agenda/types.ts`

- [ ] **Step 1:** Radio/select: Particular | Convênio

- [ ] **Step 2:** Se convênio: select planos ativos (preferir enrollment do paciente)

- [ ] **Step 3:** Persistir `payment_source` e `insurance_plan_id` no save

- [ ] **Step 4:** Commit `feat(v8): agenda insurance payment source`

---

## Task 8: Integração financeiro

**Files:**
- Modify: `src/modules/financeiro/appointment-finance.ts`
- Modify: `src/modules/financeiro/types.ts`
- Modify: `src/modules/financeiro/finance-dashboard.tsx`
- Modify: `src/modules/convenios/actions.ts` (`markClaimPaid`)

- [ ] **Step 1:** Em `applyFinanceForAppointmentStatusChange`:

```typescript
if (appointment.payment_source === "insurance" && appointment.insurance_plan_id) {
  const priceCents = await resolveInsurancePrice(...);
  await createInsuranceReceivable(...);
  await createClaimFromAppointment(...);
  return; // skip immediate revenue
}
// existing particular flow
```

- [ ] **Step 2:** `markClaimPaid`: status `paid`, `paid_amount_cents`, lançar `revenue` e estornar recebível se glosa parcial

- [ ] **Step 3:** Card no dashboard: total `insurance_receivable` pendente + link `/convenios`

- [ ] **Step 4:** Testes unitários em `appointment-finance` se existir padrão

- [ ] **Step 5:** Commit `feat(v8): finance insurance receivable integration`

---

## Task 9: Menu, export, smoke

**Files:**
- Modify: `src/components/layout/nav-links.ts` — `{ href: "/convenios", label: "Convênios", icon: Building2 }`
- Modify: `src/components/layout/filter-nav.ts`
- Modify: `src/lib/export/build-clinic-export.ts` — schema 1.7
- Create: `scripts/smoke-convenios.ts`

- [ ] **Step 1:** Nav entre Financeiro e Fornecedores (ordem gestão)

- [ ] **Step 2:** Export incluir carriers, plans, enrollments, claims (sem auth_password em export)

- [ ] **Step 3:** Smoke script: criar carrier → plan → price → enrollment → appointment insurance → complete → claim exists

- [ ] **Step 4:** Run `npm run test` e `npm run build` — PASS

- [ ] **Step 5:** Commit `feat(v8): convenios nav export smoke`

---

## Task 10: Documentação

**Files:**
- Modify: `docs/superpowers/specs/2026-07-10-convenios-planos-design.md` §12 checkboxes
- Modify: `docs/superpowers/GUIA-MASTER.md` §3 e fila pós-beta

- [ ] **Step 1:** Adicionar v8.0 Convênios ao roadmap §3

- [ ] **Step 2:** Fila pós-beta item 7 (após anamnese)

- [ ] **Step 3:** Commit `docs: v8 convenios spec and guia master`

---

## Verificação final

```bash
npm run test
npm run build
npx tsx scripts/smoke-convenios.ts
```

Expected: all pass; admin vê `/convenios`; clínica Essencial não vê menu.
