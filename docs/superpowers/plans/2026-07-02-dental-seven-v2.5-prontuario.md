# Dental Seven v2.5 — Prontuário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload e listagem de documentos do paciente (PDF/JPG/PNG) no módulo Prontuário, com Supabase Storage e RLS multi-tenant.

**Architecture:** Next.js 15 server actions para upload validado; bucket privado `patient-documents`; metadados em `patient_documents`; UI como sub-rota da ficha do paciente; gate por `clinic_modules.prontuario`.

**Tech Stack:** Next.js 15, Supabase Storage + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-v2.5-prontuario-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`** (demo Vercel).

---

## Workflow Git

| Branch | Uso |
|--------|-----|
| `main` | Demo deployada na Vercel — **intocável** |
| `feat/v2` | v2 + v2.5 + evoluções — commit a cada task concluída |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/007_patient_documents.sql` | Tabela + RLS |
| `supabase/migrations/008_storage_patient_documents.sql` | Bucket + policies Storage |
| `src/modules/prontuario/types.ts` | Tipos |
| `src/modules/prontuario/validation.ts` | Mime, tamanho máx. |
| `src/modules/prontuario/validation.test.ts` | Testes validação |
| `src/modules/prontuario/actions.ts` | list, upload, signed download URL |
| `src/modules/prontuario/document-list.tsx` | Lista + upload UI |
| `src/app/(app)/pacientes/[id]/prontuario/page.tsx` | Página prontuário |
| `src/modules/pacientes/patient-detail.tsx` | Tabs Informações / Prontuário |
| `src/lib/export/build-clinic-export.ts` | Incluir documentos no ZIP |

---

## Tasks

- [x] Task 1: Migration `007_patient_documents` + aplicar no Supabase remoto
- [x] Task 2: Migration `008_storage_patient_documents` + aplicar
- [x] Task 3: `validation.ts` + testes Vitest (mime, 10 MB)
- [x] Task 4: Actions `listPatientDocuments`, `uploadPatientDocument`, `getDocumentDownloadUrl`
- [x] Task 5: Página `/pacientes/[id]/prontuario` + `document-list.tsx`
- [ ] Task 6: Aba Prontuário na ficha (gate `enabledModules.includes('prontuario')`)
- [ ] Task 7: Export LGPD — incluir `patient_documents` no ZIP
- [ ] Task 8: Smoke manual — upload na Clínica Smoke Test (plano Completo ou toggle SuperAdmin)
- [ ] Task 9: Atualizar spec §7 critérios de aceite + commit final da fase

---

## Task 1: Migration patient_documents

**Files:**
- Create: `supabase/migrations/007_patient_documents.sql`

- [x] **Step 1:** Criar tabela `patient_documents` conforme spec §4
- [x] **Step 2:** RLS `patient_documents_clinic` (padrão `006_rls_v2.sql`)
- [x] **Step 3:** Aplicar via Supabase MCP `apply_migration`
- [x] **Step 4:** Commit `feat(v2.5): migration patient_documents`

---

## Task 2: Storage bucket

**Files:**
- Create: `supabase/migrations/008_storage_patient_documents.sql`

- [x] **Step 1:** `insert into storage.buckets` — `patient-documents`, private
- [x] **Step 2:** Policies storage: clinic_id no path = `current_clinic_id()`
- [x] **Step 3:** Aplicar migration
- [x] **Step 4:** Commit `feat(v2.5): storage bucket patient-documents`

---

## Task 3: Validação upload

**Files:**
- Create: `src/modules/prontuario/validation.ts`, `validation.test.ts`

- [x] **Step 1:** `ALLOWED_MIME_TYPES`, `MAX_FILE_BYTES = 10 * 1024 * 1024`
- [x] **Step 2:** `assertAllowedUpload(file: { type, size })` — throw Error amigável
- [x] **Step 3:** Testes: aceita pdf/jpeg/png; rejeita exe e >10MB
- [x] **Step 4:** `npm run test` — passar
- [x] **Step 5:** Commit `feat(v2.5): validacao upload prontuario`

---

## Task 4: Server actions

**Files:**
- Create: `src/modules/prontuario/types.ts`, `actions.ts`

- [x] **Step 1:** `listPatientDocuments(patientId)` — filtra `clinic_id` da sessão
- [x] **Step 2:** `uploadPatientDocument(patientId, formData)` — assertWritable paywall, validação, storage upload, insert row
- [x] **Step 3:** `getDocumentDownloadUrl(documentId)` — signed URL 60s
- [x] **Step 4:** Suporte `DEMO_MOCK_DATA` — no-op ou lista mock vazia
- [x] **Step 5:** Commit `feat(v2.5): actions prontuario upload e listagem`

---

## Task 5: UI prontuário

**Files:**
- Create: `src/app/(app)/pacientes/[id]/prontuario/page.tsx`, `document-list.tsx`

- [x] **Step 1:** Page server component — carrega paciente + documentos
- [x] **Step 2:** `document-list.tsx` — drag-drop, input file, lista com download
- [x] **Step 3:** Estados loading/erro/vazio
- [x] **Step 4:** Commit `feat(v2.5): pagina prontuario e upload UI`

---

## Task 6: Navegação na ficha

**Files:**
- Modify: `src/modules/pacientes/patient-detail.tsx` ou layout `[id]`

- [ ] **Step 1:** Tabs Informações | Prontuário (só se módulo ativo)
- [ ] **Step 2:** Link ativo conforme rota atual
- [ ] **Step 3:** Commit `feat(v2.5): aba prontuario na ficha do paciente`

---

## Task 7: Export LGPD

**Files:**
- Modify: `src/lib/export/build-clinic-export.ts`

- [ ] **Step 1:** Query `patient_documents` por `clinic_id`
- [ ] **Step 2:** Adicionar `patient_documents.json` ao ZIP; opcionalmente arquivos em subpasta `documents/`
- [ ] **Step 3:** Atualizar `build-clinic-export.test.ts` se necessário
- [ ] **Step 4:** Commit `feat(v2.5): export LGPD inclui prontuario`

---

## Task 8: Smoke aceite

- [ ] **Step 1:** Habilitar módulo `prontuario` na clínica de teste (SuperAdmin ou plano Completo)
- [ ] **Step 2:** Upload PDF de teste em `/pacientes/[id]/prontuario`
- [ ] **Step 3:** Verificar listagem e download
- [ ] **Step 4:** Marcar critérios §7 na spec

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-07-02-dental-seven-v2.5-prontuario.md`.

**Próximo:** Task 1 — migration `007_patient_documents`.
