# Beta feedback + fim da beta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development.

**Goal:** Copy fim beta 07/08/2026 no banner/founding; formulário `/feedback` persistido em `beta_feedback`; lista no Super Admin.

**Architecture:** Constantes em `founding/content.ts`. Validation puro + server action (service role). Gate `DENTAL_SEVEN_BETA_GATE`. Admin lê na mesma página founding.

**Tech Stack:** Next.js, Vitest, Supabase migration, Tailwind.

**Spec:** `docs/superpowers/specs/2026-07-13-beta-feedback-design.md`

---

### Task 1: Validation TDD

- Create: `src/modules/feedback/validation.ts` + `validation.test.ts`
- Fields: nps 0-10, top_module enum, liked_most/blocked required ≤500, would_use_today enum, notes optional ≤2000

### Task 2: Migration + types

- Create: `supabase/migrations/028_beta_feedback.sql`
- Update: `src/lib/supabase/types.ts`
- Apply via MCP `apply_migration` if remote available

### Task 3: Actions + notify

- Create: `src/modules/feedback/actions.ts`, optional `src/lib/email/feedback-notify.ts`
- createClient for auth + admin for insert

### Task 4: UI `/feedback` + nav

- page + form client; routes; sidebar (gate); banner link `/feedback`; content copy

### Task 5: Admin list

- `listBetaFeedbackForAdmin` + section on `/admin/founding`

### Task 6: Docs + `npm run test` + `npm run build`
