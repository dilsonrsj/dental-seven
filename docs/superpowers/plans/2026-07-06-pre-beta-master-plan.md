# Pré-beta Master Plan — Dental Seven

> **Superseded.** Fila e status atual: `docs/superpowers/GUIA-MASTER.md` §5.

**Goal:** Preparar deploy beta honesto para dentistas reais, com base legal, branding por clínica e planos reposicionados — sem bloquear em odontograma ou chat/IA.

**Recomendação consolidada:** Beta rápida (itens 1–4) → deploy → feedback → odontograma v3.6 → v6 WhatsApp → v7 chat.

**Spec mestre:** `docs/superpowers/specs/2026-07-06-pre-beta-roadmap-design.md`

---

## Ordem de execução

| Ordem | Iniciativa | Esforço | Plano |
|-------|------------|---------|-------|
| 1 | Termos + privacidade | 3–5 dias | `2026-07-06-legal-pages.md` (criar) |
| 2 | Reposicionar planos (WA → Completo) | 2–3 dias | `2026-07-06-plan-reposition.md` (criar) |
| 3 | Logo da clínica | 3–4 dias | `2026-07-06-clinic-logo.md` (criar) |
| 4 | Deploy beta + checklist | 2–3 dias | `2026-07-06-beta-deploy.md` (criar) |
| — | *Deploy beta para dentistas* | — | — |
| 5 | Odontograma 2D | 3–4 semanas | `2026-07-06-odontograma-v1.md` (criar pós-beta) |
| 6 | Chat + dual IA | 2–3 meses | `2026-07-06-chat-ia-vision.md` (criar pós-beta) |

---

## Item 1 — Legal (próximo a executar)

**Recomendação:** Prioridade máxima — sem isso não abrir cadastro público.

**Arquivos previstos:**
- `src/app/termos/page.tsx`, `src/app/privacidade/page.tsx`
- `src/content/legal/termos.md`, `privacidade.md` (rascunho DR7)
- `supabase/migrations/018_profiles_terms_accepted.sql`
- `src/app/cadastro/cadastro-form.tsx` — checkbox + validação
- Footer links em `entrar/page.tsx`, `cadastro/page.tsx`

---

## Item 2 — Planos

**Recomendação:** WhatsApp + `ai_agent` só em `completo`; prontuário desde `conecta`.

**Arquivos:**
- `src/lib/billing/plans.ts`
- `docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md` §7.3
- `src/modules/admin/usage.ts` (fair use)
- Smoke: reclinicar Clínica Smoke Test no Completo

---

## Item 3 — Logo clínica

**Arquivos:**
- `supabase/migrations/019_clinic_logo.sql`
- `src/modules/configuracoes/clinic-logo-actions.ts`
- `src/modules/configuracoes/clinic-logo-form.tsx`
- `src/components/layout/app-header.tsx`
- `src/modules/prontuario/generate-clinical-pdf.ts`

---

## Item 4 — Deploy beta

**Entregáveis:**
- Vercel project/branch + env checklist
- `docs/beta-tester-roadmap.md` (o que funciona / em breve)
- Supabase SMTP para convites
- Atualizar README

---

## Não fazer antes da beta

- Odontograma 3D
- Chat in-platform
- WhatsApp Meta real
- Segundo agente IA
- Cobrança automática dentista extra no Asaas

---

## Próximo passo

Confirmar com o usuário e executar **Item 1 (Legal)** via brainstorming → spec detalhada → implementação.
