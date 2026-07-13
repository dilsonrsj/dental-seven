# Beta shell + cadastro beta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cadastro beta sem preços, banner âmbar sticky, sidebar desktop fixa no scroll, e página Guia rápido `/ajuda`.

**Architecture:** Gate `DENTAL_SEVEN_BETA_GATE` controla cadastro e banner. Shell usa coluna sticky + `main` com overflow. Guia é rota autenticada sem module gate. Signup força `plan_key: inteligente` sob gate.

**Tech Stack:** Next.js App Router, React client components, Vitest, Tailwind, Lucide.

**Specs:** `docs/superpowers/specs/2026-07-13-beta-shell-ajuda-design.md` · `docs/superpowers/specs/2026-07-11-cadastro-beta-design.md`

---

### Task 1: Resolver planKey no signup beta (TDD)

**Files:**
- Create: `src/lib/auth/signup-plan.test.ts`
- Create: `src/lib/auth/signup-plan.ts`
- Modify: `src/lib/auth/actions.ts` (usar helper)

- [ ] **Step 1: Teste falhando**

```ts
import { describe, expect, it } from "vitest";
import { resolveSignupPlanKey } from "./signup-plan";

describe("resolveSignupPlanKey", () => {
  it("forces inteligente when beta gate is on", () => {
    expect(resolveSignupPlanKey("conecta", true)).toBe("inteligente");
  });

  it("keeps requested plan when beta gate is off", () => {
    expect(resolveSignupPlanKey("conecta", false)).toBe("conecta");
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import type { PlanKey } from "@/lib/billing/plans";

export function resolveSignupPlanKey(
  requested: PlanKey,
  betaGateEnabled: boolean,
): PlanKey {
  return betaGateEnabled ? "inteligente" : requested;
}
```

- [ ] **Step 3: Em `signupClinic`, `const planKey = resolveSignupPlanKey(input.planKey, isBetaGateEnabled())` e usar `planKey` em insert/modules/Asaas**

- [ ] **Step 4: `npx vitest run src/lib/auth/signup-plan.test.ts`**

---

### Task 2: Cadastro UI beta

**Files:**
- Modify: `src/app/cadastro/cadastro-form.tsx`
- Modify: `src/app/cadastro/page.tsx`

- [ ] **Step 1:** Se `isBetaGateEnabled` (prop `betaMode` do server page): sem radios/preços; seção informativa de módulos; submit com `planKey: "inteligente"`; CTA “Criar conta e começar”.
- [ ] **Step 2:** Page: banner “Beta fechada — versão de testes” + texto curto; passar `betaMode`.
- [ ] **Step 3:** Modo não-beta: manter radios/preços atuais.

---

### Task 3: Banner âmbar sticky

**Files:**
- Modify: `src/components/layout/beta-banner.tsx`

- [ ] **Step 1:** Classes alerta (âmbar/vermelho), `sticky top-0 z-50`, copy “Você está na versão beta”.

---

### Task 4: Shell sticky sidebar

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1:** Outer `h-dvh overflow-hidden`; fila `flex-1 min-h-0`; coluna direita `overflow-y-auto`; sidebar `h-full overflow-y-auto shrink-0`.
- [ ] **Step 2:** Sidebar: link Guia rápido → `/ajuda` (ícone BookOpen), fora do filtro de módulos.

---

### Task 5: Página `/ajuda` + rotas

**Files:**
- Create: `src/app/(app)/ajuda/page.tsx`
- Modify: `src/lib/auth/routes.ts` (prefix `/ajuda`)
- Test: assert `isClinicAppPath("/ajuda")` se houver teste de routes; senão criar `src/lib/auth/routes.test.ts`

---

### Task 6: Docs + verificação

**Files:**
- Modify: `docs/superpowers/GUIA-MASTER.md` — item 4 odontograma ✅; status cadastro/beta shell se couber
- Modify: specs status → implementado

- [ ] `npm run test` e `npm run build`
- [ ] Não commit (só se o usuário pedir)
