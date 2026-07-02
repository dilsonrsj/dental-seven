# Dental Seven v3 — Procedimentos (catálogo + BOM) Design Spec

**Versão:** 1.0  
**Data:** 2026-07-02  
**Status:** Aprovado — plano em `docs/superpowers/plans/2026-07-02-dental-seven-v3-procedimentos.md`  
**Pré-requisito:** v2.5 e v3.5 concluídas na branch `feat/v2`  
**Specs relacionadas:**  
- `2026-06-11-dental-seven-mvp-design.md` § roadmap v3  
- `2026-06-15-estrategia-modularidade-billing-ia.md` § módulo `procedimentos`  
- `dentist-platform-access.md` § 4.5 Procedimentos

---

## 1. Objetivo

Entregar o módulo **Procedimentos** para clínicas no plano **Completo**: catálogo de procedimentos com preço base e duração padrão, **BOM estruturado** (insumos por procedimento) e vínculo opcional na **agenda** — base para estoque (v4) e financeiro (v5).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Módulo `procedimentos` — visível só se `clinic_modules` tiver `procedimentos` enabled (plano Completo ou SuperAdmin) |
| 2 | **Abordagem de implementação:** módulo único `src/modules/procedimentos/` (padrão prontuário) |
| 3 | **BOM estruturado:** tabelas `supplies` + `procedure_supply_items` (quantidade por procedimento) — sem estoque na v3 |
| 4 | **Custo de insumo:** `unit_cost_cents` **opcional** no cadastro de `supplies` |
| 5 | **Agenda:** dropdown do catálogo + opção **"Outro (texto livre)"** quando módulo ativo |
| 6 | **`appointments`:** nova coluna `procedure_id` nullable FK; **`procedure_label` mantido** como snapshot do nome exibido |
| 7 | **Campos do procedimento:** nome, `base_price_cents`, `default_duration_min`, `is_active` |
| 8 | **UI `/procedimentos`:** abas **Procedimentos** \| **Insumos** |
| 9 | **Dentista:** aba Procedimentos em **leitura**; aba Insumos e edição de BOM **só `clinic_admin`** |
| 10 | **Deletar insumo:** bloqueado se referenciado em BOM (`ON DELETE RESTRICT` em `supply_id`) |
| 11 | **Desativar procedimento:** some do dropdown da agenda; consultas antigas mantêm `procedure_label` |
| 12 | Paywall v2: escrita bloqueada se assinatura inativa (`assertWritable`) |
| 13 | Demo `DEMO_MOCK_DATA=true`: listas vazias + mensagem orientativa, sem persistência |
| 14 | Branch: **`feat/v2` apenas** — `main`/Vercel demo intocável |
| 15 | Migration: `011_procedures_catalog.sql` |

---

## 3. Escopo

### Incluído

- Migration `011_procedures_catalog.sql` — `procedures`, `supplies`, `procedure_supply_items`, `appointments.procedure_id` + RLS
- Módulo `src/modules/procedimentos/` — types, validation, actions, testes Vitest
- Página `src/app/(app)/procedimentos/page.tsx` — abas Procedimentos \| Insumos
- Item **Procedimentos** no menu (sidebar + bottom nav) quando módulo ativo
- CRUD procedimentos + insumos + BOM (admin)
- Lista read-only de procedimentos para dentista
- Integração na agenda: select catálogo + "Outro", auto-preenche duração ao escolher catálogo
- Export LGPD: `procedures`, `supplies`, `procedure_supply_items` no ZIP (schema **1.3**)
- Smoke script mínimo (`scripts/smoke-procedimentos.ts`)

### Fora do escopo (v4+)

- Quantidades em estoque, alertas de mínimo, baixa automática (v4)
- Categorias de procedimento, descrição longa, múltiplos procedimentos por consulta
- Margem financeira, receita por procedimento (v5)
- Fornecedores e vínculo compra (v5)
- Seed odontológico completo — apenas dados mínimos para smoke

---

## 4. Modelo de dados

```sql
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
  add column procedure_id uuid references procedures(id) on delete set null;
```

**Índices sugeridos:**

- `procedures (clinic_id, is_active, name)`
- `supplies (clinic_id, is_active, name)`
- `procedure_supply_items (procedure_id)`, `(clinic_id)`
- `appointments (procedure_id)` onde `procedure_id is not null`

**RLS:** política `*_clinic` em cada tabela nova — padrão `006_rls_v2.sql` (`clinic_id = current_clinic_id() or is_super_admin()`).

**Unidades (`unit_label`):** texto livre com sugestões na UI: `un`, `cx`, `par`, `ml`, `g`.

---

## 5. Regras de negócio

### Permissões

| Ação | `clinic_admin` | `dentist` |
|------|----------------|-----------|
| Listar procedimentos ativos | ✅ | ✅ |
| CRUD procedimentos | ✅ | ❌ |
| Ver aba Insumos | ✅ | ❌ |
| CRUD insumos | ✅ | ❌ |
| Editar BOM | ✅ | ❌ |
| Selecionar procedimento na agenda | ✅ | ✅ |
| Usar "Outro (texto livre)" na agenda | ✅ | ✅ |

### Agenda

- **Sem módulo `procedimentos`:** campo texto livre `procedure_label` (comportamento atual).
- **Com módulo:** `<select>` com procedimentos `is_active = true` ordenados por nome + opção **"Outro (texto livre)"**.
- **Catálogo selecionado:** grava `procedure_id`, copia `name` → `procedure_label`, sugere `default_duration_min` → `duration_min` (editável antes de salvar).
- **Outro selecionado:** `procedure_id = null`, usuário digita `procedure_label`; duração não alterada automaticamente.
- Ao renomear procedimento no catálogo, consultas antigas **não** mudam (`procedure_label` é snapshot).

### Validação

- Nome procedimento/insumo: mínimo 2 caracteres, trim
- `base_price_cents`: inteiro ≥ 0 (UI em R$ com centavos)
- `quantity` no BOM: > 0, máx. 3 casas decimais
- Não permitir BOM duplicado (mesmo insumo duas vezes no mesmo procedimento)
- Insumo inativo: não aparece para novos itens de BOM; itens existentes permanecem até removidos

---

## 6. Arquitetura e arquivos

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/011_procedures_catalog.sql` | Tabelas + RLS + `appointments.procedure_id` |
| `src/modules/procedimentos/types.ts` | Tipos e DTOs |
| `src/modules/procedimentos/validation.ts` | Regras de nome, preço, quantidade |
| `src/modules/procedimentos/validation.test.ts` | Vitest |
| `src/modules/procedimentos/actions.ts` | CRUD procedures, supplies, BOM items |
| `src/modules/procedimentos/procedure-list.tsx` | Tabela + modal procedimento (admin) / read-only (dentist) |
| `src/modules/procedimentos/supply-list.tsx` | Tabela + modal insumo (admin only) |
| `src/modules/procedimentos/bom-editor.tsx` | Lista insumos do procedimento + quantidade (admin only) |
| `src/modules/procedimentos/procedimentos-tabs.tsx` | Abas Procedimentos \| Insumos |
| `src/app/(app)/procedimentos/page.tsx` | Server component — gate módulo + role |
| `src/modules/agenda/appointment-modal.tsx` | Select catálogo + Outro |
| `src/modules/agenda/actions.ts` | Persistir `procedure_id` |
| `src/components/layout/nav-links.ts` | Link Procedimentos |
| `src/components/layout/filter-nav.ts` | Gate `procedimentos` |
| `src/lib/export/build-clinic-export.ts` | Incluir 3 tabelas novas |
| `scripts/smoke-procedimentos.ts` | Smoke API mínimo |

**Server actions (resumo):**

- `listProcedures`, `listSupplies`, `listProcedureBom(procedureId)`
- `createProcedure`, `updateProcedure`, `setProcedureActive`
- `createSupply`, `updateSupply`, `setSupplyActive`
- `setProcedureBomItem`, `removeProcedureBomItem`
- Todas com gate `enabledModules.includes('procedimentos')` e `assertWritable` nas mutações

---

## 7. UI

### `/procedimentos`

- **Admin:** duas abas — **Procedimentos** (tabela + modal criar/editar + seção BOM no modal ou painel lateral) e **Insumos** (tabela + modal)
- **Dentista:** só aba **Procedimentos** (tabela read-only: nome, preço, duração)
- Estado vazio: "Nenhum procedimento cadastrado. O administrador pode criar o catálogo da clínica."
- BOM no modal do procedimento: select de insumo ativo + campo quantidade + lista removível

### Agenda (`appointment-modal`)

- Label **Procedimento** vira `<select>` quando módulo ativo
- Opção final: **"Outro (texto livre)"** → exibe `<Input>` como hoje
- Ao trocar de catálogo para Outro: limpa `procedure_id`, mantém texto se já digitado

### Menu

- Ícone sugerido: `ClipboardList` (lucide-react)
- Posição: após Pacientes, antes de WhatsApp

---

## 8. Export LGPD

Incluir no ZIP:

- `procedures.json` + `procedures.csv`
- `supplies.json` + `supplies.csv`
- `procedure_supply_items.json` + `procedure_supply_items.csv`
- `appointments.csv` — coluna `procedure_id` adicional

Manifest `schemaVersion`: **1.3** — contadores `procedures`, `supplies`, `procedure_supply_items`.

---

## 9. Abordagens consideradas

| # | Abordagem | Prós | Contras | Resultado |
|---|-----------|------|---------|-----------|
| 1 | Módulo único `procedimentos/` | Padrão do projeto, plano simples | — | **Escolhida** |
| 2 | Dois módulos (`procedimentos` + `supplies`) | Separação rígida | Overhead, imports cruzados | Rejeitada |
| 3 | Client-heavy + API routes | UI rápida | Foge de server actions + RLS | Rejeitada |

---

## 10. Critérios de aceite v3

- [ ] Clínica Completo com módulo `procedimentos` vê item **Procedimentos** no menu
- [ ] Clínica sem módulo não vê menu nem dropdown na agenda (texto livre permanece)
- [ ] Admin CRUD procedimentos (nome, preço, duração, ativo/inativo)
- [ ] Admin CRUD insumos (nome, unidade, custo opcional, SKU, ativo/inativo)
- [ ] Admin monta BOM com quantidade por procedimento
- [ ] Dentista vê lista de procedimentos (read-only); não vê aba Insumos
- [ ] Agenda: select catálogo preenche `procedure_id`, `procedure_label` e sugere duração
- [ ] Agenda: "Outro" grava só `procedure_label` com `procedure_id` null
- [ ] Paywall bloqueia escrita quando `expired`/`past_due`
- [ ] RLS impede leitura/escrita cross-clinic
- [ ] Export ZIP inclui procedures, supplies, procedure_supply_items (schema 1.3)
- [ ] Smoke `scripts/smoke-procedimentos.ts` passa
- [ ] Testes Vitest para validation e helpers de preço/duração/agenda

---

## 11. Changelog

| Data | Alteração |
|------|-----------|
| 2026-07-02 | Spec inicial v3 — catálogo, BOM estruturado, vínculo agenda (brainstorming aprovado) |
