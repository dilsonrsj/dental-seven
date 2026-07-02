# Dental Seven v4 — Estoque (ledger + alertas + baixa automática) Design Spec

**Versão:** 1.0  
**Data:** 2026-07-02  
**Status:** Aprovado para plano de implementação  
**Pré-requisito:** v3 Procedimentos concluída na branch `feat/v2`  
**Specs relacionadas:**  
- `2026-06-11-dental-seven-mvp-design.md` § roadmap v4  
- `2026-06-15-estrategia-modularidade-billing-ia.md` § módulo `estoque`  
- `2026-07-02-v3-procedimentos-design.md`  
- `dentist-platform-access.md` § 4.6 Estoque

**Princípio de produto:** **MicroSaaS enxuto** — automação onde agrega valor, sem bloquear operação, sem e-mail/push nem telas de auditoria pesadas na v4.

---

## 1. Objetivo

Entregar o módulo **Estoque** para clínicas no plano **Completo**: controle de quantidades com **ledger auditável**, alertas de estoque mínimo e **baixa/estorno automático** via BOM ao concluir ou reabrir consultas — base para financeiro (v5) e fornecedores (v5).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Módulo `estoque` — visível só se `clinic_modules` tiver `estoque` enabled (plano Completo ou SuperAdmin) |
| 2 | **Abordagem:** módulo `src/modules/estoque/` + hook em `updateAppointmentStatus` / save com status (sem triggers Postgres) |
| 3 | **Ledger:** tabela `stock_movements`; `supplies.quantity_on_hand` atualizado na mesma transação |
| 4 | **Baixa automática:** ao status `completed`, só se `procedure_id` + itens no BOM; sem BOM ou "Outro" → nenhuma movimentação (sem erro) |
| 5 | **Estorno automático:** ao sair de `completed`, reverte baixa já aplicada (`auto_reversal`) |
| 6 | **Idempotência:** tabela `appointment_stock_applied` evita baixa duplicada e rastreia estorno |
| 7 | **Estoque negativo:** permitido; insumo com saldo < 0 = alerta **crítico** na UI |
| 8 | **Alertas mínimo:** badge contador no menu **Estoque** + destaque na lista quando `quantity_on_hand < min_quantity` |
| 9 | **`min_quantity`:** configurável **somente em `/estoque`** (admin); nullable = sem alerta de mínimo |
| 10 | **Dentista:** leitura em `/estoque` (saldos, alertas, histórico); movimentações e mínimo só admin |
| 11 | **Histórico UI:** modal com últimas ~20 movimentações por insumo (admin e dentista leitura) |
| 12 | Paywall v2: escrita bloqueada se assinatura inativa (`assertWritable`) |
| 13 | Demo `DEMO_MOCK_DATA=true`: lista vazia + mensagem orientativa |
| 14 | Branch: **`feat/v2` apenas** — `main`/Vercel demo intocável |
| 15 | Migration: `012_stock_ledger.sql` |

---

## 3. Escopo

### Incluído

- Migration `012_stock_ledger.sql` — alter `supplies`, `stock_movements`, `appointment_stock_applied` + RLS
- Módulo `src/modules/estoque/` — types, validation, actions, testes Vitest
- Página `src/app/(app)/estoque/page.tsx`
- Item **Estoque** no menu com badge de alertas
- Entrada/saída/ajuste manual (admin)
- Edição de `min_quantity` (admin, só em `/estoque`)
- Integração agenda: baixa e estorno automáticos
- Export LGPD: `stock_movements` + campos de saldo em `supplies` (schema **1.4**)
- Smoke `scripts/smoke-estoque.ts`

### Fora do escopo (v5+)

- E-mail ou push de alerta
- Fornecedores e atalho de compra
- Financeiro / custo de movimentação
- Página de auditoria completa com filtros avançados
- Bloqueio de operação por falta de saldo

---

## 4. Modelo de dados

```sql
create type stock_movement_type as enum (
  'inbound',
  'outbound',
  'adjustment',
  'auto_deduction',
  'auto_reversal'
);

alter table supplies
  add column quantity_on_hand numeric(12, 3) not null default 0,
  add column min_quantity numeric(12, 3) check (min_quantity is null or min_quantity >= 0);

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
```

**Convenção de `quantity` em `stock_movements`:**

| `movement_type` | Sinal de `quantity` | Efeito em `quantity_on_hand` |
|-----------------|---------------------|------------------------------|
| `inbound` | positivo | + |
| `outbound` | negativo | − |
| `adjustment` | positivo ou negativo | delta |
| `auto_deduction` | negativo | − (BOM × qty procedimento) |
| `auto_reversal` | positivo | + (espelha dedução) |

`quantity_after` = saldo do insumo **após** a movimentação (snapshot para auditoria).

**RLS:** política `*_clinic` em `stock_movements` e `appointment_stock_applied` — padrão `006_rls_v2.sql`.

---

## 5. Regras de negócio

### Permissões

| Ação | `clinic_admin` | `dentist` |
|------|----------------|-----------|
| Ver lista de insumos e saldos | ✅ | ✅ |
| Ver alertas (baixo / crítico) | ✅ | ✅ |
| Ver histórico (modal) | ✅ | ✅ |
| Entrada / saída / ajuste manual | ✅ | ❌ |
| Editar `min_quantity` | ✅ | ❌ |

### Baixa automática (`→ completed`)

1. Módulo `estoque` ativo na clínica
2. Consulta tem `procedure_id` não nulo
3. Não existe `appointment_stock_applied` sem `reversed_at` para esta consulta
4. BOM do procedimento tem ≥ 1 item
5. Para cada item BOM: movimento `auto_deduction` com `quantity = -(bom.quantity)`
6. Atualiza `supplies.quantity_on_hand`
7. Insere `appointment_stock_applied`

Se BOM vazio ou sem `procedure_id`: **no-op** silencioso.

### Estorno automático (`completed →` outro status)

1. Existe `appointment_stock_applied` com `reversed_at` null
2. Busca movimentos `auto_deduction` da consulta
3. Cria `auto_reversal` com quantidades opostas
4. Atualiza saldos
5. Define `reversed_at = now()` em `appointment_stock_applied`

### Movimentação manual (admin)

- **Entrada:** `inbound`, quantidade positiva, `notes` opcional
- **Saída:** `outbound`, quantidade negativa
- **Ajuste:** `adjustment`, delta informado (pode deixar saldo negativo)

Validação: quantidade ≠ 0; máx. 3 casas decimais (reutilizar `assertBomQuantity` ou equivalente).

### Alertas

| Condição | Nível | UI |
|----------|-------|-----|
| `min_quantity` definido e `quantity_on_hand < min_quantity` | Baixo | Badge menu + linha destacada |
| `quantity_on_hand < 0` | Crítico | Destaque vermelho / ícone |
| Sem `min_quantity` | — | Sem alerta de mínimo |

Contador do badge = insumos em alerta baixo **ou** crítico.

### Módulos dependentes

- **v3 `procedimentos`:** insumos e BOM são pré-requisito; estoque **não** cadastra insumos novos na v4 (continua em `/procedimentos`)
- **v3 `procedimentos` + v4 `estoque`:** clínica Completo pode ter ambos; baixa só com os dois ativos

---

## 6. Arquitetura e arquivos

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/012_stock_ledger.sql` | Ledger + colunas em `supplies` |
| `src/modules/estoque/types.ts` | Tipos movimento, alerta, form inputs |
| `src/modules/estoque/validation.ts` | Quantidade movimento, min_quantity |
| `src/modules/estoque/validation.test.ts` | Vitest |
| `src/modules/estoque/stock-level.ts` | `getStockAlertLevel(supply)` |
| `src/modules/estoque/stock-level.test.ts` | Vitest alertas |
| `src/modules/estoque/actions.ts` | CRUD movimentos, listagem, contagem alertas |
| `src/modules/estoque/appointment-stock.ts` | `applyStockForAppointmentStatusChange` |
| `src/modules/estoque/appointment-stock.test.ts` | Vitest baixa/estorno |
| `src/modules/estoque/stock-list.tsx` | Tabela + modais |
| `src/modules/estoque/movement-history-modal.tsx` | Últimas 20 movimentações |
| `src/modules/estoque/stock-movement-form.tsx` | Entrada/saída/ajuste |
| `src/app/(app)/estoque/page.tsx` | Gate módulo + role |
| `src/modules/agenda/actions.ts` | Chamar `applyStockForAppointmentStatusChange` |
| `src/components/layout/nav-links.ts` | Link Estoque + badge |
| `src/components/layout/filter-nav.ts` | Gate `estoque` |
| `src/lib/export/build-clinic-export.ts` | Export schema 1.4 |
| `scripts/smoke-estoque.ts` | Smoke ledger + baixa |

**Server actions (resumo):**

- `listStockSupplies()` — join saldo + alerta
- `countStockAlerts()` — para badge do menu
- `recordStockMovement({ supplyId, type, quantity, notes? })` — admin
- `updateSupplyMinQuantity(supplyId, minQuantity)` — admin
- `listSupplyMovements(supplyId, limit = 20)`
- `applyStockForAppointmentStatusChange(appointmentId, previousStatus, newStatus)` — interno agenda

---

## 7. UI

### `/estoque`

- Tabela: nome insumo, saldo, unidade, mínimo, badge status (OK / Baixo / Crítico)
- Admin: botões **Entrada**, **Saída**, **Ajustar mínimo**; link para histórico
- Dentista: mesma tabela sem botões de ação
- Estado vazio: "Nenhum insumo cadastrado. Cadastre insumos em Procedimentos."
- Modal histórico: tipo, quantidade, saldo após, data, consulta (se houver), notas

### Menu

- Ícone sugerido: `Package` (lucide-react)
- Badge numérico quando `countStockAlerts() > 0`
- Posição: após Procedimentos, antes de WhatsApp

### Agenda

- Ao concluir consulta com baixa: toast discreto *"Estoque atualizado"* (só se houve movimento)
- Sem modal de confirmação (MicroSaaS enxuto)

---

## 8. Export LGPD

Incluir no ZIP:

- `stock_movements.json` + `stock_movements.csv`
- `supplies.csv` — colunas adicionais `quantity_on_hand`, `min_quantity`
- `appointment_stock_applied.json` (opcional, metadados de baixa)

Manifest `schemaVersion`: **1.4** — contadores `stock_movements`, `supplies_with_stock`.

---

## 9. Abordagens consideradas

| # | Abordagem | Prós | Contras | Resultado |
|---|-----------|------|---------|-----------|
| 1 | Módulo TS + hook agenda | Testável, padrão do projeto | Lógica no app | **Escolhida** |
| 2 | Triggers Postgres | Automático no DB | Difícil testar/debugar | Rejeitada |
| 3 | Job assíncrono | Desacoplado | Overkill para MicroSaaS | Rejeitada |

---

## 10. Critérios de aceite v4

- [ ] Clínica Completo com módulo `estoque` vê item **Estoque** no menu
- [ ] Badge no menu reflete insumos em alerta baixo ou crítico
- [ ] Admin registra entrada, saída e ajuste manual
- [ ] Admin define `min_quantity` só em `/estoque`
- [ ] Dentista vê saldos e alertas; não movimenta estoque
- [ ] Concluir consulta com `procedure_id` + BOM gera `auto_deduction`
- [ ] Concluir sem BOM ou sem `procedure_id` não gera movimento nem erro
- [ ] Reabrir/cancelar consulta concluída estorna baixa (`auto_reversal`)
- [ ] Saldo negativo permitido com alerta crítico
- [ ] Modal histórico mostra últimas movimentações do insumo
- [ ] Paywall bloqueia escrita quando `expired`/`past_due`
- [ ] Export ZIP inclui `stock_movements` (schema 1.4)
- [ ] Smoke `scripts/smoke-estoque.ts` passa
- [ ] Testes Vitest para alertas, movimentos e baixa/estorno agenda

---

## 11. Changelog

| Data | Alteração |
|------|-----------|
| 2026-07-02 | Spec inicial v4 — ledger, alertas, baixa/estorno automático (brainstorming aprovado) |
