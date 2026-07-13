# Dental Seven — Equipe: cadastro de dentistas Design Spec

**Versão:** 1.0  
**Data:** 2026-07-03  
**Status:** Aprovado (brainstorming 2026-07-03)  
**Branch:** `feat/v2`  
**Specs relacionadas:**  
- `2026-06-15-estrategia-modularidade-billing-ia.md` §3.4 (limites e +R$ 20)  
- `2026-06-15-v2-design.md` §2 decisão 8  
- `dentist-platform-access.md` §2 (admin convida / cadastra dentistas)

---

## 1. Objetivo

Permitir que o **`clinic_admin`** adicione dentistas em **`/configuracoes`**, com registro na agenda, convite por e-mail (role `dentist`) e **enforcement do limite por plano**, incluindo aviso de cobrança extra (+R$ 20/mês) e registro para o super admin.

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Fluxo: criar `dentists` + copiar `dentist_operating_hours` da clínica + `inviteUserByEmail` + `profiles` (`role=dentist`) |
| 2 | Apenas **`clinic_admin`** vê o card **Equipe** em `/configuracoes` |
| 3 | Limites inclusos: **`PLAN_DENTIST_LIMIT`** — Essencial **1** · Conecta+ **3** (já em `plans.ts`) |
| 4 | **Essencial** com 1 dentista ativo: **bloquear** novo cadastro — mensagem para upgrade Conecta |
| 5 | **Conecta+** acima de 3 ativos: **permitir** com confirmação explícita *"+R$ 20/mês por dentista extra"* |
| 6 | **Não** cobrar via Asaas automaticamente nesta entrega — controle na plataforma + trilha para DR7 |
| 7 | Super admin: **`admin_audit_log`** com ação `dentist.added` ou `dentist.extra_added` (metadados: plano, contagem, e-mail) |
| 8 | UI lista dentistas ativos (nome, cor, e-mail se houver perfil) |
| 9 | Campos do formulário: **nome**, **e-mail**, **cor** (palette rotativa se omitida) |
| 10 | E-mail único por convite — rejeitar se já existir perfil na clínica ou convite pendente duplicado |
| 11 | v1 **sem** desativar dentista — só adicionar e listar |
| 12 | Modo demo: card oculto ou mensagem "Indisponível no modo demo" |

---

## 3. Regras comerciais (referência)

| Plano | Dentistas inclusos | Acima do limite |
|-------|-------------------|-----------------|
| Essencial | 1 | Bloquear — upgrade Conecta |
| Conecta | 3 | +R$ 20/mês cada |
| Inteligente | 3 | +R$ 20/mês cada |
| Completo | 3 | +R$ 20/mês cada |

Constante nova: `EXTRA_DENTIST_PRICE = 20` em `src/lib/billing/plans.ts`.

---

## 4. Arquitetura

### 4.1 Módulo `lib/billing/dentist-quota.ts`

Funções puras (testadas):

- `getIncludedDentistLimit(planKey)` → `PLAN_DENTIST_LIMIT[planKey]`
- `countActiveDentists(dentists)` → número de `active === true`
- `assertCanAddDentist({ planKey, activeCount })` → `{ ok: true }` ou `{ ok: false, reason, requiresUpgrade?, extraCharge? }`
- `getDentistQuotaSummary({ planKey, activeCount })` → `{ included, active, extra, extraMonthlyCost }`

Regras:

```text
if plan === essencial && activeCount >= 1 → block (upgrade)
if activeCount >= included && plan !== essencial → allow with extraCharge = (activeCount + 1 - included) * 20
if activeCount < included → allow free
```

### 4.2 Server actions — `src/modules/configuracoes/team-actions.ts`

| Action | Descrição |
|--------|-----------|
| `getClinicTeam()` | Lista dentistas ativos + e-mail do perfil vinculado (join profiles) |
| `getDentistQuotaForClinic()` | Resumo para UI (inclusos, ativos, extras, custo) |
| `inviteDentistToClinic(input)` | Valida quota → insert dentist → copy hours → invite → profile |

Fluxo `inviteDentistToClinic` (service role, espelha `provisionClinicForAdmin`):

1. `assertClinicAdminWritable()` + subscription não bloqueante  
2. Validar nome (≥2), e-mail, cor hex  
3. `assertCanAddDentist` — se `requiresUpgrade`, throw  
4. Se `extraCharge > 0`, exigir `confirmExtraCharge: true` no input  
5. Insert `dentists`  
6. Copy `clinic_operating_hours` → `dentist_operating_hours`  
7. `inviteUserByEmail` → redirect `/entrar`  
8. Insert `profiles` (role dentist, clinic_id, dentist_id)  
9. Rollback em falha (delete dentist, delete user se criado)  
10. `logAdminAction` **não** — usar audit da clínica; **`logClinicTeamAction`** ou reutilizar padrão de audit existente para super admin  

**Audit:** registrar em `admin_audit_log` via helper existente em `src/modules/admin/audit.ts` — nova action `dentist.invited` com `clinicId`, `metadata: { dentistId, email, name, planKey, activeAfter, extraCount, extraMonthlyCost }`.

### 4.3 UI — `/configuracoes`

Card **Equipe** (`clinic_admin` + clínica presente):

- Resumo: *"Plano Conecta — 2 de 3 dentistas inclusos"* ou *"1 dentista extra (+R$ 20/mês)"*  
- Tabela/lista de dentistas  
- Formulário **Convidar dentista**  
- Checkbox de confirmação visível só quando extra > 0  
- Essencial no limite: botão desabilitado + link texto upgrade (Configurações assinatura)

Componentes:

- `src/modules/configuracoes/clinic-team-section.tsx` (server wrapper opcional)  
- `src/modules/configuracoes/clinic-team-form.tsx` (client)

---

## 5. Super admin

- Eventos visíveis em **`/admin/auditoria`** filtráveis por `dentist.invited` / `dentist.extra_added`  
- Quando `extraCount > 0`, action `dentist.extra_added` (ou flag no metadata) para facilitar cobrança manual Asaas  
- **Sem** e-mail automático nesta entrega (backlog: job similar a fair use alerts)

---

## 6. Erros e edge cases

| Caso | Comportamento |
|------|----------------|
| E-mail já cadastrado no Auth | Mensagem clara; não criar dentista órfão |
| Falha após insert dentist | Rollback completo |
| Assinatura bloqueante | Mesma regra das outras configs |
| Admin é também dentista | Conta no limite como qualquer ativo |
| Sem `SUPABASE_SERVICE_ROLE_KEY` | Erro de configuração |

---

## 7. Testes

| Arquivo | Casos |
|---------|-------|
| `dentist-quota.test.ts` | Essencial bloqueia 2º; Conecta permite 4º com extra; summary custo |
| `team-actions.test.ts` | Validação input; mock quota (se viável) |

Smoke manual:

1. Login smoke admin  
2. `/configuracoes` → Equipe → convidar dentista  
3. Verificar lista, agenda (filtro dentista), audit super admin  

---

## 8. Critérios de aceite

- [x] Admin vê card Equipe em `/configuracoes`
- [x] Convidar dentista cria registro + horários + convite e-mail
- [x] Essencial bloqueia 2º dentista com mensagem de upgrade
- [x] Conecta+ acima de 3 exige confirmação +R$ 20/mês
- [x] Evento aparece no audit log do super admin
- [x] `npm run test` e `npm run build` passam

**Plano:** `docs/superpowers/plans/2026-07-03-equipe-dentistas.md`
