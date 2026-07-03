# Dental Seven v6 — SuperAdmin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cockpit SuperAdmin DR7 — dashboard, ficha 360°, fair use, billing, audit, provisioning e impersonação (v6a + v6b).

**Architecture:** Migration `015`; módulo `src/modules/admin/` (pure functions + tests); evoluir `src/lib/admin/actions.ts`; UI `/admin/*`.

**Tech Stack:** Next.js 15, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-03-v6-superadmin-design.md`

**Branch:** `feat/v2` — não mergear em `main`.

---

## Tasks

### v6a
- [ ] Task 1: Migration `015_admin_platform` + Supabase
- [ ] Task 2: `usage.ts` + `dashboard-metrics.ts` + testes
- [ ] Task 3: `audit.ts` + agregação uso mensal
- [ ] Task 4: Actions admin expandidas (ficha, plano, trial, suspender)
- [ ] Task 5: Dashboard `/admin`
- [ ] Task 6: Lista `/admin/clinicas` com filtros
- [ ] Task 7: Ficha 360° `/admin/clinicas/[id]`
- [ ] Task 8: Webhook Asaas → `asaas_webhook_events`

### v6b
- [ ] Task 9: Provisioning `/admin/clinicas/nova`
- [ ] Task 10: Impersonação read-only + banner + middleware
- [ ] Task 11: `/admin/auditoria` + audit em todas ações
- [ ] Task 12: Notas DR7 + throttle flag + alertas fair use e-mail
- [ ] Task 13: Smoke `scripts/smoke-superadmin.ts`
- [ ] Task 14: Aceite spec §10 + plano

---

## Task 1: Migration admin platform

**Files:** `supabase/migrations/015_admin_platform.sql`

SQL conforme spec §4. MCP `apply_migration` name: `admin_platform`. Commit: `feat(v6): migration admin platform`

## Task 2: Usage e dashboard metrics

**Files:**
- `src/modules/admin/types.ts`
- `src/modules/admin/usage.ts`, `usage.test.ts`
- `src/modules/admin/dashboard-metrics.ts`, `dashboard-metrics.test.ts`

`getFairUseCaps(planKey)`, `computeFairUsePercent(usage, cap)`, `buildDashboardKpis(clinics[])`.

Commit: `feat(v6): admin usage e dashboard metrics`

## Task 3: Audit + sync usage

**Files:**
- `src/modules/admin/audit.ts`
- `src/modules/admin/sync-usage.ts` — conta outbound `whatsapp_messages` do mês por clínica → upsert `clinic_usage_monthly`

Commit: `feat(v6): admin audit e sync usage mensal`

## Task 4: Actions expandidas

**Files:** `src/lib/admin/actions.ts` (expandir)

- `getDashboardData()`, `listClinicsForAdmin(filters)`, `getClinicDetailForAdmin(id)`
- `updateClinicPlan`, `extendClinicTrial`, `setClinicSubscriptionStatus`
- Todas chamam `logAdminAction`

Commit: `feat(v6): actions superadmin ficha e operacoes`

## Task 5–7: UI admin

Evoluir páginas em `src/app/admin/`. Componentes em `src/modules/admin/`. Commits separados por task.

## Task 8: Asaas webhook log

Modificar `src/app/api/webhooks/asaas/route.ts` para insert em `asaas_webhook_events`.

## Task 9–12: v6b

Conforme spec §8 onda v6b.

## Task 13–14: Smoke + aceite

---

## Execution handoff

Plano em `docs/superpowers/plans/2026-07-03-dental-seven-v6-superadmin.md`.

**Subagent-Driven** — fresh subagent por task.
