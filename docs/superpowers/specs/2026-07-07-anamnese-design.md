# Dental Seven — Anamnese Design Spec

**Versão:** 1.0  
**Data:** 2026-07-07  
**Status:** Aguardando revisão  
**Branch:** `feat/v2`  
**Guia:** `docs/superpowers/GUIA-MASTER.md` — **v3.7 (pós-deploy beta)**

---

## 1. Objetivo

Adicionar **anamnese odontológica estruturada** na ficha do paciente — questionário de saúde padronizado, editável pela clínica, com histórico de atualizações. Base para triagem clínica e (futuro) preenchimento via WhatsApp (v6).

**Referência visual:** prontuário digital com ficha do paciente + timeline (ideia do usuário, jul/2026).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Módulo gated por `prontuario` (plano Conecta+) |
| 2 | **Uma anamnese ativa por paciente** (última versão; histórico de revisões opcional v1.1) |
| 3 | Template **fixo DR7** na v1 — sem editor de perguntas pela clínica |
| 4 | Local: nova aba **Anamnese** em `/pacientes/[id]/anamnese` (ao lado de Informações e Prontuário) |
| 5 | Respostas em `jsonb` validado no servidor + colunas indexáveis para alertas críticos |
| 6 | Alertas visuais para respostas de risco (alergia, anticoagulante, gestante, cardiopatia) |
| 7 | Assinatura digital do paciente: **fora do escopo v1** |
| 8 | Preenchimento via WhatsApp: **fora do escopo v1** (hook para v6) |

---

## 3. Abordagens consideradas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **A — JSONB + template TS (Recomendado)** | Rápido; flexível; fácil evoluir perguntas | Menos query SQL por pergunta |
| B — Tabela normalizada `anamnesis_answers` | Queries granulares | Overhead para MVP |
| C — Reutilizar `patients.notes` texto livre | Zero migration | Não estruturado; sem alertas |

**Recomendação:** **A** — template versionado em código (`ANAMNESIS_TEMPLATE_V1`), respostas em `patient_anamnesis.responses jsonb`.

---

## 4. Modelo de dados

### Migration `022_patient_anamnesis.sql`

```sql
create table patient_anamnesis (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  template_version text not null default 'v1',
  responses jsonb not null default '{}',
  has_critical_alert boolean not null default false,
  filled_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id)
);
```

Índices: `(clinic_id, patient_id)`, GIN em `responses` (opcional).

RLS: padrão `clinic_id = current_clinic_id()`.

### Template v1 (campos)

| `key` | Tipo | Label | Alerta crítico se |
|-------|------|-------|-------------------|
| `systemic_diseases` | text | Doenças sistêmicas | — |
| `medications` | text | Medicamentos em uso | texto não vazio + palavras-chave anticoagulante |
| `allergies` | text | Alergias | texto não vazio |
| `pregnant` | boolean | Gestante | `true` |
| `smoker` | boolean | Fumante | — |
| `hypertension` | boolean | Hipertensão | `true` |
| `diabetes` | boolean | Diabetes | `true` |
| `heart_disease` | boolean | Cardiopatia | `true` |
| `bleeding_disorder` | boolean | Distúrbio de coagulação | `true` |
| `previous_surgeries` | text | Cirurgias anteriores | — |
| `anesthesia_complications` | text | Complicações com anestesia | texto não vazio |
| `chief_complaint` | text | Queixa principal | — |
| `additional_notes` | text | Observações adicionais | — |

Função pura `computeAnamnesisAlerts(responses)` → `has_critical_alert` + lista de badges.

---

## 5. UI / UX

### Aba Anamnese

- Card resumo no topo se `has_critical_alert`: banner âmbar com bullets (ex.: "Alergia informada", "Gestante")
- Formulário em seções colapsáveis: **Geral**, **Condições**, **Histórico**
- Checkboxes + textareas; autosave desabilitado na v1 — botão **Salvar anamnese**
- Estado vazio: CTA "Preencher anamnese" com texto orientativo
- Somente leitura se assinatura bloqueada ou `canWrite === false`

### Navegação

- `PatientRecordHeader`: terceira aba **Anamnese** entre Informações e Prontuário
- Ícone/badge vermelho no tab se alerta crítico (opcional v1)

### Integração futura

- v6 WhatsApp: endpoint para paciente responder link público (spec separada)
- Timeline do prontuário pode listar "Anamnese atualizada em DD/MM" (v1.1)

---

## 6. Arquitetura técnica

```
src/modules/anamnese/
  template-v1.ts           # perguntas, tipos, validação
  template-v1.test.ts
  alerts.ts                # computeAnamnesisAlerts
  alerts.test.ts
  anamnesis-actions.ts     # get / upsert
  anamnesis-form.tsx       # formulário client
  anamnesis-summary.tsx    # banner alertas
src/app/(app)/pacientes/[id]/anamnese/page.tsx
```

**Server actions:** `getPatientAnamnesis`, `upsertPatientAnamnesis` — padrão `clinical-notes-actions`.

---

## 7. O que NÃO fazer (v1)

- Template customizável por clínica
- Assinatura eletrônica do paciente
- PDF export da anamnese
- Histórico versionado completo (só `updated_at` v1)
- Anamnese pediátrica separada

---

## 8. Critérios de aceite

- [x] Aba Anamnese visível com módulo prontuário
- [x] Formulário salva e persiste após refresh
- [x] Alertas críticos aparecem no banner quando aplicável
- [x] RLS impede cross-clinic (policy `patient_anamnesis_clinic`)
- [x] `npm run test` (228) e `npm run build` passam

**Status:** ✅ Implementado em `feat/v2` (2026-07-10). Migration `024_patient_anamnesis`. Módulo `src/modules/anamnese/`. Aba entre Informações e Prontuário.

**Plano:** `docs/superpowers/plans/2026-07-07-anamnese.md`
