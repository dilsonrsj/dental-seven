# Dental Seven v6 — SuperAdmin DR7 (cockpit operacional) Design Spec

**Versão:** 1.0  
**Data:** 2026-07-03  
**Status:** Aprovado para plano de implementação  
**Pré-requisito:** v2 Auth/Billing + módulos v2.5–v5.1 concluídos na branch `feat/v2`  
**Specs relacionadas:**  
- `2026-06-11-dental-seven-mvp-design.md` § SuperAdmin, roadmap v6  
- `2026-06-15-v2-design.md` § roles, trial, paywall  
- `2026-06-15-estrategia-modularidade-billing-ia.md` § fair use §3.4.2  
- `dentist-platform-access.md`

**Princípio de produto:** **Cockpit DR7** — visão e controle excelentes da plataforma multi-tenant. **WhatsApp real (Meta) fica em fase separada** após materiais Meta e decisão comercial.

---

## 1. Objetivo

Evoluir o SuperAdmin mínimo (v2) para um **painel operacional completo** da DR7: dashboard executivo, ficha 360° por clínica, visibilidade de billing/fair use, suporte auditado e provisioning — preparando a plataforma para WhatsApp real e v6.1 (IA) sem integrá-los nesta fase.

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | **v6 = SuperAdmin completo**; integração Meta/WhatsApp em **fase posterior** (`v6-whatsapp`) |
| 2 | Entrega em **duas ondas:** **v6a** (visão/controle) → **v6b** (suporte/provisioning) |
| 3 | **Abordagem:** evoluir `/admin` no mesmo app Next.js + migrations |
| 4 | **Fair use v6a:** só **visibilidade** (% cap, alertas no `/admin`); sem bloqueio no app da clínica |
| 5 | **Fair use v6b:** notificar admin da clínica (80% / 100%); **throttle** efetivo na fase WhatsApp real |
| 6 | **Impersonação v6b:** somente leitura; **sem acesso a prontuário** nem histórico médico |
| 7 | Export LGPD de clínica: só via `/admin` (auditado); **não** durante impersonação |
| 8 | **Provisioning v6b:** DR7 cria clínica + convite `clinic_admin`; **`/cadastro` self-service continua** |
| 9 | Caps fair use conforme estratégia §3.4.2 (Conecta 1200 conv./mês, etc.) |
| 10 | Impersonação: timeout de sessão (ex.: 2h); banner fixo “Modo suporte” |
| 11 | Branch: **`feat/v2` apenas** — `main`/Vercel demo intocável |
| 12 | Migration: `015_admin_platform.sql` |

---

## 3. Escopo

### Incluído — v6a

- Migration `015_admin_platform.sql` — uso mensal, audit log, notas admin
- Dashboard `/admin` — KPIs, alertas, trials expirando
- Lista `/admin/clinicas` — filtros (plano, status, alerta uso)
- Ficha 360° `/admin/clinicas/[id]` — billing, contagens, módulos, fair use, ações operacionais
- Visão Asaas: IDs cliente/assinatura + últimos webhooks (read-only)
- Agregação de uso mensal (`clinic_usage_monthly`)
- Export LGPD por clínica (já existe — integrar na ficha + audit)

### Incluído — v6b

- Provisioning `/admin/clinicas/nova` — criar clínica + convite admin
- Impersonação read-only (sem prontuário)
- `admin_audit_log` — ações SuperAdmin
- `clinics.admin_notes` — notas internas DR7
- `/admin/auditoria` — log global
- Notificações fair use 80%/100% (e-mail admin clínica)
- Flag `whatsapp_throttled` por clínica (enforcement na fase WhatsApp)

### Fora do escopo (v6)

- Meta Cloud API, WABA, n8n, `/api/whatsapp/*`
- Agente IA + KB (v6.1)
- Chat paciente na plataforma (decisão comercial futura)
- Reprecificação automática de planos
- DRE / contabilidade DR7
- Retool ou app admin separado

---

## 4. Modelo de dados

```sql
-- v6: admin platform — usage, audit, notes

alter table clinics
  add column if not exists admin_notes text,
  add column if not exists whatsapp_throttled boolean not null default false;

create table clinic_usage_monthly (
  clinic_id uuid not null references clinics(id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  whatsapp_conversations integer not null default 0 check (whatsapp_conversations >= 0),
  ai_responses integer not null default 0 check (ai_responses >= 0),
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, year_month)
);

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id) on delete restrict,
  action text not null,
  clinic_id uuid references clinics(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table asaas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  clinic_id uuid references clinics(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_clinic_usage_monthly_year
  on clinic_usage_monthly(year_month);

create index idx_admin_audit_log_created
  on admin_audit_log(created_at desc);

create index idx_admin_audit_log_clinic
  on admin_audit_log(clinic_id, created_at desc)
  where clinic_id is not null;

create index idx_asaas_webhook_events_clinic_created
  on asaas_webhook_events(clinic_id, created_at desc)
  where clinic_id is not null;

alter table clinic_usage_monthly enable row level security;
alter table admin_audit_log enable row level security;
alter table asaas_webhook_events enable row level security;

-- Somente super_admin via service role / policies dedicadas
create policy "clinic_usage_monthly_super_admin" on clinic_usage_monthly for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "admin_audit_log_super_admin" on admin_audit_log for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "asaas_webhook_events_super_admin" on asaas_webhook_events for select
  using (public.is_super_admin());
```

**Impersonação (sessão — sem tabela obrigatória v6):**

- Cookie/httpOnly `impersonation` com `{ clinicId, startedAt, actorId }`
- Middleware bloqueia rotas de prontuário quando cookie presente
- Profile efetivo: leitura como `clinic_admin` da clínica alvo, flags `is_impersonating`

### Fair use — caps por plano (interno DR7)

| Plano | WhatsApp conv./mês | IA respostas/mês |
|-------|-------------------|------------------|
| Essencial | — | — |
| Conecta | 1.200 | — |
| Inteligente | 1.200 | 1.500 |
| Completo | 2.500 | 3.500 |

**Cálculo v6a:** `whatsapp_conversations` = mensagens outbound em `whatsapp_messages` do mês (simulado conta); `ai_responses` = 0 até v6.1.

**Percentual:** `usage / cap * 100`; alertas em 80% e 100% no dashboard SuperAdmin.

---

## 5. Regras de negócio

### Permissões

| Ação | `super_admin` | `clinic_admin` | `dentist` |
|------|---------------|----------------|-----------|
| Acessar `/admin` | ✅ | ❌ | ❌ |
| Dashboard / lista / ficha clínica | ✅ | ❌ | ❌ |
| Alterar plano / trial / suspender | ✅ | ❌ | ❌ |
| Toggle módulos | ✅ | ❌ | ❌ |
| Export LGPD any clinic | ✅ | ❌ (só própria) | ❌ |
| Impersonação | ✅ (v6b) | ❌ | ❌ |
| Provisioning nova clínica | ✅ (v6b) | ❌ | ❌ |
| Ver prontuário na impersonação | ❌ | — | — |

### Impersonação — rotas bloqueadas

- `/pacientes/[id]/prontuario` e sub-rotas
- APIs/actions: upload documento, notas clínicas, gerar PDF clínico, enviar documento
- Qualquer download de arquivo de prontuário

**Permitido:** agenda (leitura), lista pacientes (dados cadastrais), configurações (leitura), WhatsApp simulado (leitura).

### Ações operacionais (ficha clínica)

| Ação | Efeito | Audit |
|------|--------|-------|
| Alterar `plan_key` | Atualiza plano + módulos default | ✅ |
| Estender trial | `trial_ends_at` += N dias | ✅ |
| Suspender | `subscription_status = past_due` ou flag manual | ✅ |
| Reativar | `subscription_status = active` | ✅ |
| Toggle módulo | `clinic_modules.enabled` | ✅ |
| Export ZIP | download via `/api/clinics/[id]/export` | ✅ |
| Notas internas | `admin_notes` | ✅ |

### Self-service vs provisioning

- **`/cadastro`:** fluxo padrão — trial 7 dias, sem cartão, conversão Asaas (inalterado)
- **`/admin/clinicas/nova`:** DR7 cria clínica manualmente + envia convite ao primeiro admin
- Ambos coexistem

### Webhook Asaas

- `POST /api/webhooks/asaas` persiste em `asaas_webhook_events` (além de atualizar `clinics`)
- SuperAdmin vê últimos 20 eventos na ficha da clínica

---

## 6. Arquitetura e arquivos

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/015_admin_platform.sql` | Tabelas usage, audit, webhook log, colunas clinics |
| `src/modules/admin/types.ts` | Tipos dashboard, ficha, audit |
| `src/modules/admin/usage.ts` | Cálculo % fair use, caps por plano |
| `src/modules/admin/usage.test.ts` | Vitest |
| `src/modules/admin/dashboard-metrics.ts` | Agregações KPI |
| `src/modules/admin/dashboard-metrics.test.ts` | Vitest |
| `src/modules/admin/actions.ts` | CRUD admin expandido (evoluir `lib/admin/actions`) |
| `src/modules/admin/impersonation.ts` | Start/stop sessão, guards |
| `src/modules/admin/impersonation.test.ts` | Vitest |
| `src/modules/admin/audit.ts` | `logAdminAction` helper |
| `src/app/admin/page.tsx` | Dashboard v6a |
| `src/app/admin/clinicas/page.tsx` | Lista com filtros |
| `src/app/admin/clinicas/[id]/page.tsx` | Ficha 360° |
| `src/app/admin/clinicas/nova/page.tsx` | Provisioning v6b |
| `src/app/admin/auditoria/page.tsx` | Log global v6b |
| `src/modules/admin/admin-dashboard.tsx` | Cards + alertas (client) |
| `src/modules/admin/clinic-detail.tsx` | Ficha tabs (client) |
| `src/modules/admin/provision-clinic-form.tsx` | Form nova clínica |
| `src/components/layout/impersonation-banner.tsx` | Banner modo suporte |
| `src/lib/supabase/middleware.ts` | Guard prontuário em impersonação |
| `src/app/api/webhooks/asaas/route.ts` | Persistir `asaas_webhook_events` |

---

## 7. UI

### `/admin` — dashboard (v6a)

- Cards: ativas, trial, `past_due`, encerradas, MRR estimado
- Widget: trials expirando em 7 dias
- Tabela alertas: clínicas ≥ 80% fair use
- Link “Ver todas as clínicas”

### `/admin/clinicas` — lista (v6a)

- Filtros: plano, status, módulo, alerta uso
- Busca por nome/slug
- Colunas: clínica, plano, status, trial, % WhatsApp, criada em

### `/admin/clinicas/[id]` — ficha 360° (v6a + v6b)

**Abas/seções:**
1. **Resumo** — identidade, billing, notas DR7 (v6b)
2. **Uso** — barras fair use, storage
3. **Módulos** — toggle list (existente)
4. **Billing** — Asaas IDs, últimos webhooks
5. **Ações** — plano, trial, suspender, export, impersonar (v6b)

### `/admin/clinicas/nova` — provisioning (v6b)

- Nome*, slug*, plan_key, dias de trial
- E-mail do primeiro admin*
- Cria clínica + módulos do plano + convite Supabase Auth

### Impersonação (v6b)

- Banner amarelo fixo: *“Modo suporte DR7 — somente leitura — sem acesso a prontuário”*
- Botão “Sair do modo suporte” no banner

---

## 8. Ondas de entrega

### v6a (primeira entrega)

1. Migration 015 (usage, audit, webhook events, admin_notes)
2. Agregação uso mensal + dashboard KPIs
3. Lista clínicas com filtros
4. Ficha 360° (billing, uso, módulos, ações)
5. Fair use visível (sem enforcement)
6. Persistência webhook Asaas

### v6b (segunda entrega)

7. Provisioning nova clínica + convite
8. Impersonação read-only sem prontuário
9. Audit log + página `/admin/auditoria`
10. Notificações fair use 80%/100%
11. Flag `whatsapp_throttled` (UI SuperAdmin; enforcement na fase WhatsApp)

---

## 9. Abordagens consideradas

| # | Abordagem | Resultado |
|---|-----------|-----------|
| 1 | Evoluir `/admin` no app Next.js | **Escolhida** |
| 2 | App admin separado | Rejeitada |
| 3 | Retool / ferramenta externa | Rejeitada |

---

## 10. Critérios de aceite v6

### v6a

- [ ] SuperAdmin vê dashboard com KPIs e alertas fair use
- [ ] Lista clínicas com filtros por plano, status e uso
- [ ] Ficha 360° com billing, contagens, módulos e % fair use
- [ ] Alterar plano, estender trial, suspender/reativar com audit
- [ ] Webhooks Asaas visíveis na ficha (últimos eventos)
- [ ] `/cadastro` self-service continua funcionando
- [ ] Nenhum bloqueio de uso na clínica por fair use (v6a)

### v6b

- [ ] Provisioning: criar clínica + convite admin pelo `/admin`
- [ ] Impersonação read-only com banner; **403 em prontuário**
- [ ] Audit log registra ações SuperAdmin
- [ ] Notas internas DR7 na ficha
- [ ] Página `/admin/auditoria` com log global
- [ ] Notificação e-mail fair use 80%/100% (admin clínica)
- [ ] Flag throttle visível no SuperAdmin
- [ ] Testes Vitest para usage, impersonation guards

---

## 11. Fase posterior — WhatsApp real (`v6-whatsapp`)

Não faz parte desta spec. Pré-requisitos:

- Materiais Meta (cobrança, WABA, BSP)
- Decisão comercial (absorver / reprecificar / portal+link)
- SuperAdmin v6 com métricas de uso já coletadas

---

## 12. Changelog

| Data | Alteração |
|------|-----------|
| 2026-07-03 | Spec inicial v6 SuperAdmin — brainstorming aprovado (v6a + v6b; WhatsApp separado) |
