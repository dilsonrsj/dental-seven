# Beta shell — banner, guia rápido e sidebar sticky

**Versão:** 1.0  
**Data:** 2026-07-13  
**Status:** Design aprovado (opção A — 2026-07-13) — **implementado**  
**Branch:** `feat/v2`

---

## Contexto

Pré-deploy beta. Odontograma 3D validado e aprovado (2026-07-13). Cadastro sem preços já tem spec: `2026-07-11-cadastro-beta-design.md`.

Pedidos adicionais do usuário:

1. Banner beta bem visível no topo (âmbar/vermelho de alerta — não verde neon; primary da ID é azul).
2. Botão na sidebar para manual / guia da Dental Seven.
3. Sidebar desktop sempre visível no scroll de páginas longas.

**Decisão (2026-07-13):** opção **A** — banner âmbar/vermelho + Guia rápido (não FAQ separado nesta entrega).

---

## Escopo desta entrega

### 1. Cadastro beta (spec existente — implementar junto)

Conforme `specs/2026-07-11-cadastro-beta-design.md`:

- UI sem radios/preços; seção “O que você pode testar”.
- Backend: com `DENTAL_SEVEN_BETA_GATE=true`, `plan_key = inteligente` (ignorar `planKey` do form).
- Banner de página: “Beta fechada — versão de testes”.

### 2. Banner global no app (`BetaBanner`)

- Continua gated por `isBetaGateEnabled()`.
- Estilo de **alerta**: fundo âmbar/vermelho suave, borda e texto de destaque (não primary azul).
- Copy curta e clara: “Você está na versão beta” + nota de recursos em evolução + link feedback WhatsApp (já existente).
- Sticky no topo do viewport (`sticky top-0 z-50`) para permanecer visível ao rolar.

### 3. Sidebar sticky (desktop `lg+`)

**Problema:** o shell usa coluna flex com altura da página; o scroll é do documento → a `aside` sobe e some.

**Solução:**

- Outer shell: `min-h-screen`; banner sticky.
- Fila principal (`sidebar` + conteúdo): altura `calc(100dvh - altura do banner)` (ou `min-h-0 flex-1` com overflow controlado).
- `aside`: `sticky` / `h-full` + `overflow-y-auto` própria se a nav for longa; **não** sobe com o scroll do `main`.
- `main` (ou coluna da direita): `overflow-y-auto` / `min-h-0` para ser o único painel que rola o conteúdo da página.
- Mobile: sem mudança estrutural (sidebar continua hidden; bottom nav).

### 4. Guia rápido — `/ajuda`

- Link na sidebar (após nav de módulos, antes do footer / Sair): rótulo **“Guia rápido”** (ícone `BookOpen` ou similar).
- Sempre visível (não depende de `clinic_modules`); incluir `/ajuda` em `CLINIC_APP_PREFIXES` / rotas autenticadas do app.
- Página com seções stub curtas (editáveis depois), uma por área principal:

  1. Agenda  
  2. Pacientes  
  3. Prontuário e odontograma  
  4. Procedimentos  
  5. Estoque  
  6. Financeiro  
  7. Convênios  
  8. Configurações e equipe  

- Cada seção: 2–4 frases “como usar” honestas para beta; odontograma com destaque (“Gire, clique e explore”).
- Rodapé: WhatsApp/IA “em breve” + link Enviar feedback.
- **Fora de escopo agora:** FAQ em aba separada, busca, vídeos, PDF.

---

## Arquivos principais

| Arquivo | Mudança |
|---------|---------|
| `src/app/cadastro/page.tsx` | Banner beta fechada |
| `src/app/cadastro/cadastro-form.tsx` | Sem planos; módulos informativos |
| `src/lib/auth/actions.ts` | Override `inteligente` sob beta gate |
| `src/components/layout/beta-banner.tsx` | Estilo alerta + sticky |
| `src/components/layout/app-shell.tsx` | Layout sticky sidebar / scroll no main |
| `src/components/layout/app-sidebar.tsx` | Sticky + link Guia rápido |
| `src/app/(app)/ajuda/page.tsx` | Página do guia (nova) |
| `src/lib/auth/routes.ts` | Prefixo `/ajuda` |
| `docs/superpowers/GUIA-MASTER.md` | Odontograma item 4 ✅; checklist banner/guia se útil |

---

## Critérios de aceite

- [ ] Cadastro beta: critérios da spec `2026-07-11`
- [ ] Banner âmbar/vermelho visível e sticky no app autenticado com gate ligado
- [ ] Em desktop, sidebar permanece na viewport ao rolar páginas longas (ex.: financeiro, convênios)
- [ ] Sidebar mostra “Guia rápido” → `/ajuda` com seções stub
- [ ] `npm run test` e `npm run build` passam

---

## Fora de escopo

- FAQ dedicado / abas Guia|FAQ  
- Cor verde neon na paleta  
- Deploy Vercel / SMTP (item 5 do GUIA-MASTER)  
- Alterar preços em `/visao`

---

## Próximo passo

1. Review deste arquivo pelo usuário  
2. Plano curto `plans/2026-07-13-beta-shell-ajuda.md`  
3. Implementação (TDD onde couber — gate plan override, rotas) + update GUIA-MASTER §5 (odontograma ✅)
