# Dental Seven v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o MVP demo em produto multi-tenant com Supabase Auth, planos modulares, trial 7d, paywall e base para billing Asaas.

**Architecture:** Next.js 15 monolith; Supabase Auth + RLS por `clinic_id`; `profiles` + `clinic_modules`; signup via service role; middleware SSR refresh session.

**Tech Stack:** Next.js 15, Supabase Auth/RLS, Asaas (webhook stub), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-15-v2-design.md` · Preços: `2026-06-15-estrategia-modularidade-billing-ia.md` §3.4

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/003-006_*.sql` | profiles, billing, modules, RLS |
| `src/lib/auth/context.ts` | Sessão + clínica + módulos |
| `src/lib/auth/actions.ts` | signupClinic, signOut |
| `src/lib/billing/plans.ts` | Preços e módulos por plano |
| `src/lib/billing/subscription.ts` | Paywall helpers |
| `src/lib/supabase/middleware.ts` | Session refresh |
| `src/middleware.ts` | Auth gate |
| `src/app/cadastro/*` | Signup clínica |
| `src/app/entrar/*` | Login e-mail/senha |
| `src/components/layout/app-shell.tsx` | Shell + paywall |
| `src/app/(app)/configuracoes/*` | Plano e conta |
| `src/app/api/webhooks/asaas/route.ts` | Webhooks billing |

---

## Tasks (status sessão 2026-06-15)

- [x] Task 1: Migrations 003–006 aplicadas via MCP
- [x] Task 2: Billing plans + subscription helpers + tests
- [x] Task 3: Auth context, signup, admin client, middleware
- [x] Task 4: /cadastro + /entrar (e-mail/senha)
- [x] Task 5: AppShell, PaywallOverlay, nav por módulos
- [x] Task 6: Actions multi-tenant (agenda, pacientes, whatsapp)
- [x] Task 7: createPatient + /pacientes/novo
- [x] Task 8: /configuracoes + webhook Asaas stub
- [x] Task 9: Exportação LGPD ZIP
- [x] Task 10: SuperAdmin `/admin` mínimo
- [x] Task 11: Integração Asaas create-customer/subscription (sandbox)
- [x] Task 12: E-mail trial expirado (Resend/Supabase Edge)

---

## Setup pós-implementação

1. Habilitar **Email provider** no Supabase Auth
2. Adicionar `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`
3. Redirect URLs: `http://localhost:3000/**`
4. Testar: `/cadastro` → trial → `/agenda`

---

## Verificação (2026-07-02)

**Branch:** `feat/v2` (2 commits à frente de `main`, ainda não pushado)

| Verificação | Resultado |
|-------------|-----------|
| `npm run test` | 32/32 passando |
| `npm run build` | OK |
| Smoke signup E2E | OK — `v2smoke-full-20260702@test.dr7.app` / Clínica Smoke Test |
| Migrations 003–006 | Aplicadas no Supabase remoto |
| `SUPABASE_SERVICE_ROLE_KEY` | Configurada em `.env.local` |
| `DEMO_MOCK_DATA` | `false` (Supabase real) |

**Setup pós-implementação**

- [x] `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`
- [x] Smoke: `/cadastro` → trial → `/agenda` → paciente → logout → re-login
- [ ] Email provider habilitado no Supabase Auth (confirmar no dashboard)
- [ ] Redirect URLs: `http://localhost:3000/**` + URL de produção quando deployar v2

---

## Critérios de aceite (spec §12)

| Critério | Status |
|----------|--------|
| Nova clínica → trial 7d | ✅ smoke 2026-07-02 |
| Login isolado RLS | ✅ smoke |
| `clinic_admin` cadastra paciente | ✅ Marina Smoke |
| Trial expirado → paywall | ✅ overlay + bloqueio UI (2026-07-02) |
| Webhook Asaas sandbox | ✅ `PAYMENT_CONFIRMED` → `active` |
| Exportação ZIP | ✅ buildClinicExport + rota autenticada |
| SuperAdmin lista clínicas | ✅ `/admin` + toggle módulos |
| Vitest billing/paywall | ✅ 32 testes |

---

## Fase aceite v2 (próximas tasks)

- [x] Task 13: Simular `subscription_status = expired` → paywall visível + actions bloqueadas (2026-07-02)
- [x] Task 14: POST webhook Asaas sandbox → status `active` confirmado via SQL (2026-07-02)
- [x] Task 15: Exportação ZIP — `dental-seven-export_clinica-smoke-test_2026-07-02.zip` (3898 bytes)
- [x] Task 16: SuperAdmin `/admin` — lista clínicas + toggle módulos (`superadmin-smoke@dr7.app`)
- [x] Task 17: Link **Configurações** na nav (sidebar + bottom nav)
- [x] Task 18: Spec §12 marcada → `finishing-a-development-branch`

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-06-15-dental-seven-v2.md`.

Tasks 1–12 concluídas. Fase aceite (Tasks 13–18) concluída em 2026-07-02. **Próximo:** `finishing-a-development-branch` → integrar `feat/v2` ou planejar v2.5 (prontuário).
