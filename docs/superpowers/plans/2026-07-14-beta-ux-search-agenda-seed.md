# Beta UX search / agenda / seed — Implementation Plan

> **For agentic workers:** Execute task-by-task. **No production deploy.**

**Goal:** Autocomplete em buscas, Nova Consulta abre modal, bloqueio de overlap, seed demo no signup beta.

**Architecture:** Pure helpers + server actions; UI client leve; seed pós-signup só com gate beta.

**Tech Stack:** Next.js, Supabase, Vitest

---

### Task 1: Auto-open modal Nova Consulta

**Files:** `patient-record-header.tsx`, `agenda/page.tsx`, `agenda-page-client.tsx`

- [x] Link `?patientId=&new=1`
- [x] `initialOpenNew` → `modalOpen` inicial true

### Task 2: Overlap

**Files:** `src/modules/agenda/appointment-overlap.ts` (+test), `actions.ts`

- [x] TDD `intervalsOverlap` / `hasDentistConflict`
- [x] Integrar em `upsertAppointment`

### Task 3: Patient search autocomplete

**Files:** `patient-search-field.tsx`, `patient-list.tsx`, `actions.ts` se precisar

- [x] Dropdown com debounce
- [x] Combobox no `appointment-modal` para paciente

### Task 4: Seed beta

**Files:** `src/lib/beta/seed-clinic-demo.ts`, `src/lib/auth/actions.ts`

- [x] Seed após criar clínica
- [x] Teste unitário de contagens / smoke parcial
