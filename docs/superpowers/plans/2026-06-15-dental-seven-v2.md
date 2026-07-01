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

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-06-15-dental-seven-v2.md`.

Tarefas 9–12 concluídas nesta sessão. Próximo: build + smoke signup end-to-end.
