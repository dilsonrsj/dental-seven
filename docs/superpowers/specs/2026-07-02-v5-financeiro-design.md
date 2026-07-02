# Dental Seven v5 — Financeiro (receita, custos, margem) Design Spec

**Versão:** 1.0  
**Data:** 2026-07-02  
**Status:** Aprovado para plano de implementação  
**Pré-requisito:** v3 Procedimentos e v4 Estoque concluídos na branch `feat/v2`  
**Specs relacionadas:**  
- `2026-06-11-dental-seven-mvp-design.md` § roadmap v5  
- `2026-06-15-estrategia-modularidade-billing-ia.md` § módulo `financeiro`  
- `2026-07-02-v3-procedimentos-design.md`  
- `2026-07-02-v4-estoque-design.md`  
- `dentist-platform-access.md` § 4.7 Financeiro

**Princípio de produto:** **MicroSaaS enxuto** — automação no fluxo de consulta concluída, dashboard mínimo, sem BI pesado nem integração contábil. **Fornecedores → v5.1.**

---

## 1. Objetivo

Entregar o módulo **Financeiro** para clínicas no plano **Completo**: receita e custo variável automáticos ao concluir consultas (via catálogo + BOM), lançamentos manuais, custos fixos mensais simplificados e dashboard de margem — base para fornecedores (v5.1).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Escopo v5: **só `financeiro`** — módulo `fornecedores` fica para **v5.1** |
| 2 | **Abordagem:** módulo `src/modules/financeiro/` + ledger + hook na agenda (padrão v4 estoque) |
| 3 | **Ledger:** tabela `financial_entries` com tipos e `source` (`auto` \| `manual`) |
| 4 | **Receita automática:** ao `completed`, se `procedure_id` → `base_price_cents` do procedimento |
| 5 | **Receita manual:** admin pode lançar `manual_revenue` (consultas avulsas, ajustes) |
| 6 | **Estorno receita:** automático ao sair de `completed` (`revenue_reversal`) |
| 7 | **Custo variável automático:** ao `completed`, BOM × `unit_cost_cents` (insumos com custo cadastrado) |
| 8 | **Custo variável manual:** admin lança `manual_expense` |
| 9 | **Estorno custo variável:** automático ao sair de `completed` (`variable_cost_reversal`) |
| 10 | **Custos fixos:** um total mensal por clínica (`clinic_monthly_settings.fixed_costs_cents`) — sem catálogo de despesas |
| 11 | **Idempotência:** `appointment_finance_applied` (padrão `appointment_stock_applied`) |
| 12 | **Dashboard admin:** cards Receita, Custo variável, Custos fixos, Margem + lista recente |
| 13 | **Dentista:** vê só receita das **próprias** consultas (sem custos fixos, margem da clínica, lançamentos manuais) |
| 14 | Paywall v2: escrita bloqueada se assinatura inativa |
| 15 | Branch: **`feat/v2` apenas** — `main`/Vercel demo intocável |
| 16 | Migration: `013_financial_ledger.sql` |

---

## 3. Escopo

### Incluído

- Migration `013_financial_ledger.sql`
- Módulo `src/modules/financeiro/` — types, validation, actions, appointment-finance, testes Vitest
- Página `/financeiro` — dashboard + lançamentos
- Item **Financeiro** no menu quando módulo ativo
- Hook agenda: baixa/estorno financeiro ao mudar status
- Export LGPD schema **1.5**
- Smoke `scripts/smoke-financeiro.ts`

### Fora do escopo (v5.1+)

- Módulo `fornecedores`
- Gráficos, filtros avançados, export CSV do período
- Comissões por dentista (backlog)
- Status pagamento/recebimento, NF, integração contábil
- Catálogo detalhado de despesas fixas

---

## 4. Modelo de dados

```sql
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
```

**Convenção de `amount_cents`:**

| `entry_type` | Sinal | Exemplo |
|--------------|-------|---------|
| `revenue`, `manual_revenue`, `revenue_reversal` (estorno) | receita: positivo; estorno: negativo | +15000 / −15000 |
| `variable_cost`, `manual_expense`, `variable_cost_reversal` | custo: negativo; estorno: positivo | −3200 / +3200 |

**Margem do mês (admin):**
```
receita = SUM(amount_cents WHERE entry_type IN ('revenue','revenue_reversal','manual_revenue'))
custo_variavel = ABS(SUM(amount_cents WHERE entry_type IN ('variable_cost','variable_cost_reversal','manual_expense')))
custos_fixos = clinic_monthly_settings.fixed_costs_cents
margem = receita - custo_variavel - custos_fixos
```

**RLS:** política `*_clinic` em todas as tabelas novas.

---

## 5. Regras de negócio

### Permissões

| Ação | `clinic_admin` | `dentist` |
|------|----------------|-----------|
| Ver dashboard completo (margem, custos) | ✅ | ❌ |
| Ver receita das próprias consultas | ✅ | ✅ |
| Lançamentos manuais | ✅ | ❌ |
| Editar custos fixos do mês | ✅ | ❌ |
| Ver custos variáveis / fixos da clínica | ✅ | ❌ |

### Financeiro automático (`→ completed`)

Pré-requisitos (todos):
1. Módulo `financeiro` ativo
2. Não existe `appointment_finance_applied` sem `reversed_at`

**Receita** (se `procedure_id`):
- `entry_type = revenue`, `amount_cents = procedure.base_price_cents`
- `description = procedure.name`, `dentist_id` da consulta

**Custo variável** (se BOM com custos):
- Para cada item BOM onde `supply.unit_cost_cents` não é null:
  - `amount_cents = -(qty × unit_cost_cents)` arredondado
  - `entry_type = variable_cost`
- Itens sem custo: ignorados

Sem `procedure_id` ou BOM vazio: no-op para aquele componente (sem erro).

### Estorno (`completed →` outro)

- Busca entradas `auto` da consulta
- Cria pares `revenue_reversal` / `variable_cost_reversal` com valores opostos
- `reversed_at = now()` em `appointment_finance_applied`

### Lançamentos manuais (admin)

- **Receita:** `manual_revenue`, valor positivo, descrição obrigatória
- **Despesa:** `manual_expense`, valor positivo no form → gravado negativo no ledger

### Custos fixos

- Admin edita `fixed_costs_cents` para o mês corrente (ou selecionado)
- Um registro por `clinic_id` + `year_month`
- Default 0 se não configurado

### Dependências de módulos

| Módulo | Necessário para |
|--------|-----------------|
| `procedimentos` | Receita/custo auto (preço + BOM) |
| `financeiro` | Qualquer lançamento financeiro |
| `estoque` | **Não** obrigatório — custo vem do BOM/custo cadastrado, não do ledger de estoque |

---

## 6. Arquitetura e arquivos

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/013_financial_ledger.sql` | Tabelas + RLS |
| `src/modules/financeiro/types.ts` | Tipos entry, dashboard, forms |
| `src/modules/financeiro/validation.ts` | Valores, descrição, year_month |
| `src/modules/financeiro/validation.test.ts` | Vitest |
| `src/modules/financeiro/month-summary.ts` | Agregação receita/custo/margem |
| `src/modules/financeiro/month-summary.test.ts` | Vitest |
| `src/modules/financeiro/appointment-finance.ts` | Auto apply/reversal |
| `src/modules/financeiro/appointment-finance.test.ts` | Vitest |
| `src/modules/financeiro/actions.ts` | CRUD entries, settings, listagens |
| `src/modules/financeiro/finance-dashboard.tsx` | Cards + lista |
| `src/modules/financeiro/manual-entry-form.tsx` | Modal lançamento manual |
| `src/modules/financeiro/fixed-costs-form.tsx` | Modal custos fixos do mês |
| `src/app/(app)/financeiro/page.tsx` | Gate módulo + role |
| `src/modules/agenda/actions.ts` | Hook `applyFinanceForAppointmentStatusChange` |
| `src/components/layout/nav-links.ts` | Link Financeiro |
| `src/lib/export/build-clinic-export.ts` | Export 1.5 |
| `scripts/smoke-financeiro.ts` | Smoke E2E |

---

## 7. UI

### `/financeiro` — admin

- Seletor de mês (default: corrente)
- 4 cards: Receita, Custo variável, Custos fixos, Margem
- Botões: **Novo lançamento**, **Editar custos fixos**
- Tabela: data, tipo, descrição, valor, origem (auto/manual)

### `/financeiro` — dentista

- Card **Minha receita** do mês
- Lista filtrada: só entradas `revenue*` com `dentist_id` do perfil
- Sem botões de ação

### Agenda

- Toast *"Financeiro atualizado"* quando `financeResult.applied` (opcional, junto ou após estoque)

### Menu

- Ícone: `Wallet` ou `CircleDollarSign` (lucide-react)
- Após Estoque, antes de WhatsApp

---

## 8. Export LGPD

- `financial_entries.json` + `financial_entries.csv`
- `clinic_monthly_settings.json`
- `appointment_finance_applied.json` (metadados)
- Manifest `schemaVersion`: **1.5**

---

## 9. Abordagens consideradas

| # | Abordagem | Resultado |
|---|-----------|-----------|
| 1 | Módulo + ledger + hook agenda | **Escolhida** |
| 2 | Só views agregadas sem ledger | Rejeitada |
| 3 | Integração contábil externa | Rejeitada (fora do MicroSaaS) |

---

## 10. Critérios de aceite v5

- [ ] Clínica Completo com módulo `financeiro` vê **Financeiro** no menu
- [ ] Admin vê dashboard com 4 cards do mês
- [ ] Admin edita custos fixos mensais (total único)
- [ ] Admin cria lançamentos manuais (receita e despesa)
- [ ] Concluir consulta com `procedure_id` gera receita automática
- [ ] Concluir com BOM e custos gera custo variável automático
- [ ] Reabrir consulta estorna lançamentos automáticos
- [ ] Dentista vê só receita das próprias consultas
- [ ] Paywall bloqueia escrita
- [ ] Export ZIP inclui `financial_entries` (schema 1.5)
- [ ] Smoke `scripts/smoke-financeiro.ts` passa
- [ ] Testes Vitest para summary, appointment-finance e validation

---

## 11. Changelog

| Data | Alteração |
|------|-----------|
| 2026-07-02 | Spec inicial v5 — financeiro MicroSaaS enxuto (brainstorming aprovado) |
