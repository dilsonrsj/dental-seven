# Cadastro beta — UX sem preços/plano

**Versão:** 1.0  
**Data:** 2026-07-11  
**Status:** Design aprovado — **implementado** (2026-07-13)  
**Branch:** `feat/v2`

---

## Contexto

Na beta fechada (`DENTAL_SEVEN_BETA_GATE=true`), o fluxo founding → `/cadastro` não deve vender plano nem preço. O testador precisa entender o que pode usar, com honestidade sobre WhatsApp e IA (só produção futura).

**Decisão do usuário (2026-07-11):** opção **1** — `plan_key` padrão fixo = **`inteligente`** no backend.

---

## Objetivo

Simplificar `/cadastro` na beta: destaque de versão de testes, remoção de escolha de plano e preços, seção informativa de módulos, signup sempre com pacote Inteligente.

---

## Escopo

### UI — `src/app/cadastro/page.tsx` + `cadastro-form.tsx`

1. **Banner beta em destaque** (substituir/amplificar chip atual “Versão beta · Founding Member”)
   - Título: “Beta fechada — versão de testes”
   - Texto: teste do produto; feedback bem-vindo; alguns recursos indisponíveis

2. **Remover**
   - Fieldset “Plano” com radios (`conecta`, `inteligente`, etc.)
   - `PLAN_PRICES`, taglines comerciais e qualquer `R$ …/mês`

3. **Adicionar — seção informativa** “O que você pode testar na beta” (somente leitura)

   | Faixa | Módulos |
   |-------|---------|
   | Essencial | Agenda, Pacientes |
   | Conecta | + Prontuário, Procedimentos |
   | Inteligente | + Estoque, Financeiro, Convênios |
   | Completo (produção futura) | + Fornecedores, WhatsApp, IA |

   Rodapé:
   - “Na beta você entra com o pacote Inteligente para testar o máximo da clínica digital, exceto WhatsApp e IA.”
   - “Preços e cobrança real entram na produção comercial.”

4. **Formulário mantido:** clínica, responsável, e-mail, senha, termos

### Backend — `src/lib/auth/actions.ts` (`signupClinic`)

- Quando `DENTAL_SEVEN_BETA_GATE=true`: ignorar `input.planKey` do form e gravar `plan_key: "inteligente"`
- Módulos via `defaultModuleEnabled` existente em `src/lib/billing/plans.ts`
- **WhatsApp** e **ai_agent** permanecem desligados no signup beta (já comportamento esperado da matriz)

### Fora do escopo (esta entrega)

- `/visao`, `/configuracoes` com preços — alinhar depois
- Escolha de plano e preços voltam com produção comercial + Asaas real
- Mudanças em Asaas/trial

---

## Arquivos principais

| Arquivo | Mudança |
|---------|---------|
| `src/app/cadastro/page.tsx` | Banner beta |
| `src/app/cadastro/cadastro-form.tsx` | Remover planos; seção módulos; `planKey` fixo ou omitido |
| `src/lib/auth/actions.ts` | Override `inteligente` com beta gate |
| `src/lib/billing/plans.ts` | Referência `PLAN_MODULES` (sem alteração esperada) |

---

## Critérios de aceite

- [ ] Cadastro beta sem radios nem preços
- [ ] Banner beta visível e claro no topo
- [ ] Tabela/lista de módulos por faixa com WhatsApp/IA marcados como produção futura
- [ ] Nova clínica criada com `plan_key = inteligente` e módulos corretos (sem whatsapp/ai_agent)
- [ ] `npm run test` e smoke manual em `/cadastro` com founder válido

---

## Próximo passo

1. Plano em `docs/superpowers/plans/2026-07-11-cadastro-beta.md` (opcional, mudança pequena)
2. Implementação + smoke
3. Atualizar `GUIA-MASTER.md` §5 se item entrar no checklist pré-beta
