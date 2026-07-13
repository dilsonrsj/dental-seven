# Logo da Clínica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans.

**Goal:** Upload de logo por clínica em Configurações, exibição no header e PDFs clínicos.

**Spec:** `docs/superpowers/specs/2026-07-07-clinic-logo-design.md`  
**Guia:** `docs/superpowers/GUIA-MASTER.md` §5 item 3

**Status:** Implementado em 2026-07-07

---

## Entregas

- [x] Migration `019_clinic_logo.sql` + apply Supabase
- [x] `src/lib/clinic/clinic-logo.ts` + testes
- [x] `clinic-logo-actions.ts` + `clinic-logo-form.tsx`
- [x] `context.ts` — `logo_preview_url` no session
- [x] `app-header.tsx` — logo ou mark Dental Seven
- [x] `generate-clinical-pdf.ts` — logo no topo
- [x] `next.config.ts` — remotePatterns Supabase storage
- [x] Testes + build
