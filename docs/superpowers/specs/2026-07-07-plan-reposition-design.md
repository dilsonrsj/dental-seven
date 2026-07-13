# Dental Seven — Reposicionamento de Planos Design Spec

**Versão:** 1.0  
**Data:** 2026-07-07  
**Status:** Aprovada — implementada em 2026-07-07  
**Branch:** `feat/v2`  
**Roadmap:** Item 2 de `docs/superpowers/specs/2026-07-06-pre-beta-roadmap-design.md`

---

## 1. Objetivo

Reposicionar a matriz **plano × módulo** para que **WhatsApp** e **agente IA** fiquem exclusivos do plano **Completo**, enquanto planos intermediários ganham módulos clínicos (prontuário, procedimentos, estoque, financeiro).

Alinha o produto à narrativa comercial pré-beta: Conecta = clínica digital; Inteligente = gestão; Completo = atendimento inteligente (WA + IA quando v6 entregar).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Nova matriz conforme §4 abaixo |
| 2 | **Grandfather (opção A):** clínicas existentes **não** sofrem migration automática de `clinic_modules` |
| 3 | Apenas **novos cadastros** e **troca de plano pelo super admin** (`applyPlanModuleDefaults`) recebem a matriz nova |
| 4 | `ai_agent` continua **desligado por default** no signup (flag beta; super admin liga) |
| 5 | Módulos clínicos passam a **ligar por default** quando incluídos no plano (remover bloqueio atual em `defaultModuleEnabled`) |
| 6 | Fair use: caps de WhatsApp/IA **somente Completo** |
| 7 | Nav e rotas já respeitam `clinic_modules.enabled` — sem mudança de arquitetura |
| 8 | Atualizar copy em `/visao` e opcional tagline no `/cadastro` |
| 9 | Spec comercial `2026-06-15-estrategia-modularidade-billing-ia.md` — adicionar nota de supersessão §7.3 (não reescrever doc inteiro) |

---

## 3. Situação atual (`plans.ts`)

```
essencial:  agenda, pacientes
conecta:    + whatsapp
inteligente:+ ai_agent
completo:   + prontuario, procedimentos, estoque, financeiro, fornecedores
```

Problema: Conecta vendido como "WhatsApp"; módulos clínicos concentrados só no Completo.

---

## 4. Nova matriz (alvo)

| Módulo | Essencial R$99 | Conecta R$149 | Inteligente R$279 | Completo R$349 |
|--------|:--------------:|:-------------:|:-----------------:|:--------------:|
| agenda, pacientes | ✅ | ✅ | ✅ | ✅ |
| prontuario | — | ✅ | ✅ | ✅ |
| procedimentos | — | ✅ | ✅ | ✅ |
| estoque | — | — | ✅ | ✅ |
| financeiro | — | — | ✅ | ✅ |
| fornecedores | — | — | — | ✅ |
| whatsapp | — | — | — | ✅ |
| ai_agent | — | — | — | ✅ |

### Narrativa comercial (taglines)

| Plano | Tagline curta |
|-------|---------------|
| Essencial | Agenda + Pacientes |
| Conecta | Clínica digital (prontuário + procedimentos) |
| Inteligente | Gestão (estoque + financeiro) |
| Completo | Atendimento completo (WhatsApp + IA + fornecedores) |

Preços **inalterados**.

---

## 5. `defaultModuleEnabled` (novos cadastros)

| Módulo | Default no signup |
|--------|-------------------|
| Incluído no plano (exceto abaixo) | `true` |
| `ai_agent` | `false` (beta; super admin ativa) |
| Fora do plano | `false` |

Remove o bloco que força `false` para prontuário/procedimentos/estoque/financeiro/fornecedores em todos os planos.

---

## 6. Fair use (`usage.ts`)

| Plano | WhatsApp/mês | IA/mês |
|-------|:------------:|:------:|
| essencial | — | — |
| conecta | — | — |
| inteligente | — | — |
| completo | 2.500 | 3.500 |

---

## 7. Clínicas existentes (grandfather)

- **Não** criar migration SQL de backfill
- Clínica Smoke Test e pilotos mantêm `clinic_modules` atuais
- Super admin pode:
  - Ajustar módulos manualmente na ficha da clínica
  - Trocar `plan_key` → dispara `applyPlanModuleDefaults` (comportamento já existente)
- Documentar no plano de implementação: reclinicar smoke para Completo se precisar testar WA

---

## 8. Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/billing/plans.ts` | `PLAN_MODULES`, `defaultModuleEnabled`, `PLAN_TAGLINES` (novo) |
| `src/lib/billing/plans.test.ts` | **Criar** — matriz e defaults |
| `src/modules/admin/usage.ts` | `FAIR_USE_CAPS` |
| `src/modules/admin/usage.test.ts` | Atualizar expectativas conecta/inteligente |
| `src/lib/commercial/visao-content.ts` | `PLANS`, `FUTURE_MODULES` |
| `src/app/cadastro/cadastro-form.tsx` | Exibir `PLAN_TAGLINES` sob cada plano |
| `docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md` | Nota no topo: matriz §7.3 superseded por esta spec |

**Sem mudança:** `signupClinic`, middleware, nav (já lê `clinic_modules`), `dentist-quota`.

---

## 9. O que NÃO fazer

- Migration que desliga WhatsApp em clínicas Conecta existentes
- Renomear slugs `plan_key` no banco
- Alterar preços Asaas
- Implementar WhatsApp real ou IA (v6+)
- Cookie/legal (item 1 — feito)

---

## 10. Critérios de aceite

- [x] `PLAN_MODULES` reflete matriz §4
- [x] Novo signup Conecta: prontuário + procedimentos `enabled=true`; whatsapp `enabled=false`
- [x] Novo signup Completo: whatsapp `enabled=true`, ai_agent `enabled=false`
- [x] Fair use: só Completo tem caps
- [x] Testes `plans.test.ts` + `usage.test.ts` passam
- [x] Copy `/visao` alinhada
- [x] Clínicas existentes inalteradas (verificar smoke manualmente)
- [x] `npm run test` e `npm run build` passam

**Plano:** `docs/superpowers/plans/2026-07-06-plan-reposition.md`

---

## 11. Riscos

| Risco | Mitigação |
|-------|-----------|
| Conecta antigo com WA ligado confunde testers | Comunicar grandfather; super admin ajusta |
| Spec comercial §7 desatualizada | Nota de supersessão + roadmap |
| Demo `/visao` ainda cita WA no Conecta | Atualizar `visao-content.ts` nesta entrega |
