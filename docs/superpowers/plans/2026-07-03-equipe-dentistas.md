# Equipe — cadastro de dentistas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir que clinic_admin convide dentistas em `/configuracoes` com limite por plano e audit para super admin.

**Architecture:** Quota pura em `lib/billing/dentist-quota.ts`; server actions em `team-actions.ts` (service role + invite); UI `clinic-team-form.tsx`.

**Tech Stack:** Next.js 15, Supabase Auth admin, Vitest

---

### Task 1: Quota billing — ✅

- `src/lib/billing/plans.ts` — `EXTRA_DENTIST_PRICE`
- `src/lib/billing/dentist-quota.ts` + test

### Task 2: Server actions + audit — ✅

- `src/modules/configuracoes/team-actions.ts`
- `src/modules/admin/audit.ts` — `dentist.invited`, `dentist.extra_added`
- `src/app/admin/auditoria/page.tsx` — labels

### Task 3: UI + page — ✅

- `src/modules/configuracoes/clinic-team-form.tsx`
- `src/app/(app)/configuracoes/page.tsx` — card Equipe

### Task 4: Verificação

- [ ] `npm run test`
- [ ] `npm run build`
