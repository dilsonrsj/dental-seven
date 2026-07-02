# Dental Seven v3.5 — Prontuário (fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viewer inline de documentos, evolução clínica e geração de receita/atestado/guia em PDF com assinatura visual — completando o módulo Prontuário.

**Architecture:** Extensão de `src/modules/prontuario/`; migrations 009 + bucket `clinic-assets`; viewer modal client-side com signed URLs; geração PDF server-side com `pdf-lib`; integração WhatsApp demo existente.

**Tech Stack:** Next.js 15, Supabase Storage/RLS, pdf-lib, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-30-v3.5-prontuario-viewer-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`** (demo Vercel).

---

## Workflow Git

| Branch | Deploy Vercel | Uso |
|--------|---------------|-----|
| `main` | Demo comercial | **Intocável** |
| `feat/v2` | Não deployada | v2 + v2.5 + v3.5 — commit por task |

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/009_dentists_clinical_notes.sql` | CRO, specialty, signature + clinical notes |
| `supabase/migrations/010_storage_clinic_assets.sql` | Bucket assinaturas |
| `src/modules/prontuario/document-viewer-modal.tsx` | Modal PDF/imagem |
| `src/modules/prontuario/document-list.tsx` | Botão Visualizar |
| `src/modules/prontuario/clinical-notes.tsx` | Lista + form evolução |
| `src/modules/prontuario/clinical-notes-actions.ts` | CRUD notas |
| `src/modules/prontuario/templates/` | Tipos + campos receita/atestado/guia |
| `src/modules/prontuario/generate-clinical-pdf.ts` | pdf-lib builder + tests |
| `src/modules/prontuario/clinical-document-form.tsx` | UI novo documento |
| `src/modules/prontuario/actions.ts` | generateClinicalDocument, sendToWhatsApp |
| `src/modules/configuracoes/dentist-profile-form.tsx` | CRO, specialty, assinatura |
| `src/lib/export/build-clinic-export.ts` | Incluir `patient_clinical_notes` |

---

## Tasks — Onda 1: Viewer

- [x] Task 1: `document-viewer-modal.tsx` — PDF iframe + image lightbox
- [x] Task 2: Integrar Visualizar em `document-list.tsx` + testes de helper mime
- [x] Task 3: Smoke viewer — abrir Laudo Smoke v2.5 no modal

---

## Tasks — Onda 2: Evolução + dentista

- [x] Task 4: Migration `009` + aplicar Supabase
- [x] Task 5: Migration `010` bucket `clinic-assets` + aplicar
- [x] Task 6: `clinical-notes-actions.ts` + `clinical-notes.tsx`
- [x] Task 7: Form perfil dentista (CRO, specialty, assinatura) em Configurações
- [x] Task 8: Export LGPD inclui `patient_clinical_notes.json`

---

## Task 8: Export LGPD clinical notes

**Files:**
- Modify: `src/lib/export/build-clinic-export.ts`
- Modify: `src/lib/export/build-clinic-export.test.ts`
- Modify: `scripts/smoke-prontuario.ts`

- [x] **Step 1:** Incluir `patient_clinical_notes.json` + CSV no ZIP
- [x] **Step 2:** Manifest `schemaVersion` 1.2 + contagem `patient_clinical_notes`
- [x] **Step 3:** `dentists.csv` com CRO, specialty, signature_storage_path
- [x] **Step 4:** Commit `feat(v3.5): export LGPD clinical notes`

---

## Tasks — Onda 3: Documentos clínicos

- [ ] Task 9: `templates/` + `generate-clinical-pdf.ts` + Vitest
- [ ] Task 10: `clinical-document-form.tsx` + action `generateClinicalDocument`
- [ ] Task 11: Preview, salvar em Storage, listar como `source: generated`
- [ ] Task 12: `sendDocumentToWhatsAppThread` — mensagem simulada
- [ ] Task 13: Smoke E2E — gerar atestado → visualizar → WhatsApp simulado
- [ ] Task 14: Marcar spec §7 aceite + commit final fase

---

## Task 1: Document viewer modal

**Files:**
- Create: `src/modules/prontuario/document-viewer-modal.tsx`
- Modify: `src/modules/prontuario/document-list.tsx`

- [x] **Step 1:** Modal com título, botão fechar, overlay
- [x] **Step 2:** Se `mime_type` PDF → `iframe src={signedUrl}`
- [x] **Step 3:** Se imagem → `img` + botões zoom +/-
- [x] **Step 4:** Loading/erro ao buscar signed URL
- [x] **Step 5:** Commit `feat(v3.5): modal viewer prontuario`

---

## Task 2: Botão Visualizar na lista

- [x] **Step 1:** Substituir fluxo "só Baixar" por Visualizar + Baixar
- [x] **Step 2:** Teste helper `isPreviewableMime(type)` se extraído
- [x] **Step 3:** `npm run test` passando
- [x] **Step 4:** Commit `feat(v3.5): botao visualizar documentos`

---

## Task 3: Smoke viewer

**Files:**
- Create: `scripts/smoke-viewer.ts`

- [x] **Step 1:** Script valida login, documento "Laudo Smoke v2.5", signed URL TTL 120s e bytes `%PDF`
- [x] **Step 2:** Smoke UI — `/pacientes/{id}/prontuario` → Visualizar → modal com iframe (conta `v2smoke-full-20260702@test.dr7.app`, 2026-07-02)
- [x] **Step 3:** Commit `test(v3.5): smoke viewer modal prontuario`

---

## Task 4: Migration clinical notes

**Files:**
- Create: `supabase/migrations/009_dentists_clinical_notes.sql`

- [x] **Step 1:** `alter table dentists` — cro, specialty, signature_storage_path
- [x] **Step 2:** `patient_clinical_notes` + índices + RLS clinic
- [x] **Step 3:** Aplicar via Supabase MCP
- [x] **Step 4:** Commit `feat(v3.5): migration clinical notes e dentist profile`

---

## Task 9: Geração PDF

**Files:**
- Create: `src/modules/prontuario/templates/types.ts`, `receita.ts`, `atestado.ts`, `guia.ts`
- Create: `src/modules/prontuario/generate-clinical-pdf.ts`, `generate-clinical-pdf.test.ts`

- [ ] **Step 1:** `npm install pdf-lib` (commit package-lock)
- [ ] **Step 2:** Função `buildClinicalPdf(template, payload)` retorna `Uint8Array`
- [ ] **Step 3:** Testes: PDF não vazio, contém metadados esperados (text extract básico ou tamanho mínimo)
- [ ] **Step 4:** Commit `feat(v3.5): geracao PDF documentos clinicos`

---

## Task 12: WhatsApp simulado

- [ ] **Step 1:** Localizar thread do paciente (`whatsapp_threads`)
- [ ] **Step 2:** Inserir mensagem outbound com texto do documento
- [ ] **Step 3:** Toast + link para `/whatsapp`
- [ ] **Step 4:** Commit `feat(v3.5): envio simulado documento whatsapp`

---

## Execution handoff

Plano salvo em `docs/superpowers/plans/2026-06-30-dental-seven-v3.5-prontuario.md`.

**Próximo:** Revisão da spec pelo usuário → Task 1 (viewer modal).

**Dependência npm nova:** `pdf-lib` (apenas Onda 3, Task 9).
