# Dental Seven — Precificação oficial

**Versão:** 2.1  
**Data:** 2026-07-21  
**Status:** **Oficial** (aprovada Dilson) — preços na capa beta; LP oficial pós-beta  
**Branch:** `feat/v2`  
**Espelho OS:** `DR7PERFORMANCE-OS/operacao/desenvolvimento/dental-seven/precificacao.md`

> **Lista sempre aparece.** Duas fases de oferta: founders (beta) ≠ lançamento (landing).

---

## Lógica (duas fases · âncora Conecta)

| Fase | O que aparece | Onde |
|------|---------------|------|
| **Beta / Founders (agora)** | **Lista sempre** + oferta founding = **−25% da lista em 12×** (Conecta+) | Capa `/founding` + banner beta |
| **Lançamento (depois)** | **Lista sempre** + oferta = **mensal** (99 / 150 / 279 / 349) | Landing oficial Dental Seven |

| Conceito | Conecta (exemplo) |
|----------|-------------------|
| Lista | **R$ 187,00** |
| Founding (beta) | **12× R$ 140,25** (−25% lista) |
| Oferta lançamento (LP) | **R$ 150,00**/mês |

Founding em 12×: **Conecta, Inteligente, Completo**. Essencial = entrada (sem founding 12×).

---

## Tabela — capa beta (Founders)

| Plano | Lista | Oferta Founding |
|-------|------:|-----------------|
| Essencial | R$ 124,00 | Entrada · founding 12× a partir do Conecta |
| **Conecta** ★ | **R$ 187,00** | **12× R$ 140,25** (R$ 1.683,00) |
| Inteligente | R$ 349,00 | **12× R$ 261,75** (R$ 3.141,00) |
| Completo | R$ 437,00 | **12× R$ 327,75** (R$ 3.933,00) |

## Tabela — landing de lançamento (pós-beta)

| Plano | Lista | Oferta mensal |
|-------|------:|-------------:|
| Essencial | R$ 124,00 | **R$ 99,00** |
| Conecta ★ | R$ 187,00 | **R$ 150,00** |
| Inteligente | R$ 349,00 | **R$ 279,00** |
| Completo | R$ 437,00 | **R$ 349,00** |

---

## O que entra em cada plano

| | **Essencial** | **Conecta** ★ | **Inteligente** | **Completo** |
|--|:-------------:|:-------------:|:---------------:|:------------:|
| **Tagline** | Agenda, prontuário e financeiro | Clínica digital + voz | Gestão completa | Inbox WA + IA |
| Agenda + pacientes | ✅ | ✅ | ✅ | ✅ |
| Prontuário + odontograma **2D** + anamnese | ✅ | ✅ | ✅ | ✅ |
| Financeiro básico | ✅ | ✅ | ✅ | ✅ |
| Site clínica (subdomínio) | ✅ | ✅ | ✅ | ✅ |
| Procedimentos + BOM | — | ✅ | ✅ | ✅ |
| Confirmações WhatsApp | — | **300**/mês | **600**/mês | fair use |
| **Agendamento rápido por voz (IA)** | — | ✅ | ✅ | ✅ |
| **Suporte** | e-mail | chat in-app | chat in-app | chat in-app |
| Estoque + fornecedores | — | — | ✅ | ✅ |
| Financeiro avançado | — | — | ✅ | ✅ |
| Convênios | — | — | ✅ | ✅ |
| WhatsApp inbox + IA | — | — | — | ✅ |
| Dentistas inclusos | 1 | 3 | 3 | 3 |
| Pacientes (fair use) | 200 | 500 | 500 | ilimitado* |

★ Plano **âncora de vendas**.  
\*Fair use de plataforma.

**Voz:** dentista fala nome + dia + horário → sistema agenda → notificação na tela. **Conecta+** e **trial**. Spec: `2026-07-20-voice-booking-agent-design.md`.

### Resumo por plano

| Plano | Inclui |
|-------|--------|
| **Essencial** | Agenda, pacientes, prontuário 2D + anamnese, financeiro básico, site. 1 dentista · 200 pacientes. |
| **Conecta** | + procedimentos/BOM + 300 WA + **agendamento rápido por voz**. 3 dentistas · 500 pacientes. |
| **Inteligente** | + estoque/fornecedores + financeiro avançado + convênios + 600 WA. |
| **Completo** | + inbox WhatsApp + IA + fair use WA. |

### Completo — fair use WhatsApp (interno)

- Cap: ~**2.000** utility + ~**1.500** service/mês  
- Excedente: throttle + aviso  
- Vitrine: “incluso para uso clínico típico”

### Regras fechadas

| Regra | Decisão |
|-------|---------|
| Entrada | Trial **7 dias** sem cartão · sem implantação |
| Beta | Capa `/founding` mostra lista + founding 12× (Conecta+) |
| Lançamento | LP oficial: lista + oferta mensal |
| Reajuste | IPCA · aviso 30d · mín. 12 meses |
| Odontograma | Só 2D |

### Código

| Constante | Arquivo | Valor |
|-----------|---------|-------|
| Fases / copy | `src/lib/commercial/pricing-phases.ts` | founding vs launch |
| `PLAN_LIST_PRICES` | `src/lib/billing/plans.ts` | 124 / 187 / 349 / 437 |
| `PLAN_PRICES` (oferta lançamento) | idem | 99 / **150** / 279 / 349 |
| `PLAN_ANNUAL_MONTHLY` (founding 12×) | idem | 93 / **140,25** / 261,75 / 327,75 |
| Capa beta | `src/app/founding/founding-form.tsx` | tabela founding |
| Anúncio e-mail | `src/lib/email/founders-pricing-announce.ts` · `scripts/notify-founders-pricing.ts` | — |

---

## Histórico

| Data | Evento |
|------|--------|
| 15/06/2026 | v1: 99 / 149 / 279 / 349 |
| 17/07/2026 | v2: 89,90 / 139,90 / 179,90 / 249,90 |
| 20/07/2026 | Lista + oferta · anual −25% 12× · voz Conecta+ |
| 21/07/2026 | **v2.1:** duas fases (founders 12× na beta · oferta mensal só na LP) · notificação inscritos |
