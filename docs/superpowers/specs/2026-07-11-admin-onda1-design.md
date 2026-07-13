# Super Admin — Onda 1 (cockpit beta) Design Spec

**Versão:** 1.0  
**Data:** 2026-07-11  
**Status:** Aprovado  
**Pré-requisito:** v6 SuperAdmin base (`/admin`, `/admin/clinicas`, `/admin/auditoria`) + programa `/founding`

---

## 1. Objetivo

Evoluir o `/admin` de painel de assinatura para **cockpit operacional da beta fechada**: fila de ações, pipeline founding, adoção e auditoria recente — sem gráficos ou analytics avançados.

---

## 2. Escopo

### Incluído

- Home `/admin` com:
  - KPIs atuais (mantidos)
  - Fila **Ação necessária hoje** (unificada)
  - Resumo Founding (7 dias, conversão, top refs)
  - Novos cadastros (7 dias)
  - Últimas 10 ações de auditoria
  - Trials expirando e fair use (mantidos)
- Nova página `/admin/founding`:
  - Tabela completa `beta_founders`
  - Pipeline: formulário → acessou cadastro → clínica criada → ativo
  - Link copiável `/founding?ref={ref_slug}`
  - Contagem de indicados por `invite_ref`
- Campo `ref_slug` único em `beta_founders` (gerado no cadastro founding)
- Regra **sem adoção**: clínica criada há ≥ 7 dias e (0 pacientes ou 0 consultas)

### Fora do escopo (Onda 2+)

- Gráficos MRR, mapa UF, webhooks Asaas agregados
- Edição de feedback_status no admin (somente leitura por agora)
- Mobile-first do Super Admin

---

## 3. Regras de negócio

| Regra | Detalhe |
|-------|---------|
| `ref_slug` | Slug legível único por founder (ex.: `dra-marina-aracaju-se`) |
| `invite_ref` | Quem indicou — valor do `?ref=` da URL (pode ser outro `ref_slug`) |
| Founder pendente | `signup_completed_at` nulo e `created_at` há ≥ 2 dias |
| Sem adoção | `created_at` ≤ hoje−7d e (`patients`=0 ou `appointments`=0) |
| Ativo na beta | `clinic_id` preenchido e (pacientes > 0 ou consultas > 0) |

---

## 4. Arquivos

| Path | Responsabilidade |
|------|------------------|
| `supabase/migrations/027_beta_founders_ref_slug.sql` | Coluna `ref_slug` + índice único |
| `src/lib/founding/ref-slug.ts` | Geração e unicidade de slug |
| `src/modules/admin/operations-dashboard.ts` | Fila de ações, adoção, resumo founding |
| `src/modules/admin/founding-pipeline.ts` | Estágios do pipeline |
| `src/modules/admin/admin-audit-labels.ts` | Labels PT das ações |
| `src/lib/admin/actions.ts` | Queries agregadas |
| `src/modules/admin/admin-dashboard.tsx` | UI home |
| `src/modules/admin/founding-list.tsx` | UI founding |
| `src/app/admin/founding/page.tsx` | Rota founding |

---

## 5. Aceite

- [x] Super admin vê fila de ações na home com links para ficha/founding
- [x] `/admin/founding` lista founders com estágio e link copiável
- [x] Novo founder recebe `ref_slug` automático
- [x] Indicações rastreáveis via `invite_ref` e contagem na tabela
- [x] `npm run test` passa
