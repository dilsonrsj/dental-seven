# Reposicionamento de Planos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover WhatsApp e IA para o plano Completo e distribuir módulos clínicos nos planos Conecta e Inteligente, sem alterar clínicas existentes (grandfather).

**Architecture:** Fonte da verdade em `src/lib/billing/plans.ts` (`PLAN_MODULES` + `defaultModuleEnabled`). Runtime continua lendo `clinic_modules` por clínica. Fair use em `usage.ts` segue `plan_key`. Copy comercial em `visao-content.ts` e taglines no cadastro.

**Tech Stack:** Next.js 15, Vitest, Supabase (sem migration SQL)

**Spec:** `docs/superpowers/specs/2026-07-07-plan-reposition-design.md`

---

## Task 1: Testes da matriz de planos

**Files:**
- Create: `src/lib/billing/plans.test.ts`
- Modify: `src/lib/billing/plans.ts`

- [ ] **Step 1: Criar testes que falham com a matriz atual**

```typescript
import { describe, expect, it } from "vitest";
import {
  PLAN_MODULES,
  defaultModuleEnabled,
  isModuleEnabledForPlan,
} from "./plans";

describe("PLAN_MODULES repositioned", () => {
  it("conecta inclui prontuario e procedimentos, sem whatsapp", () => {
    expect(PLAN_MODULES.conecta).toEqual(
      expect.arrayContaining(["prontuario", "procedimentos"]),
    );
    expect(PLAN_MODULES.conecta).not.toContain("whatsapp");
  });

  it("inteligente inclui estoque e financeiro, sem whatsapp nem ai", () => {
    expect(PLAN_MODULES.inteligente).toEqual(
      expect.arrayContaining(["estoque", "financeiro"]),
    );
    expect(PLAN_MODULES.inteligente).not.toContain("whatsapp");
    expect(PLAN_MODULES.inteligente).not.toContain("ai_agent");
  });

  it("completo inclui whatsapp, ai_agent e fornecedores", () => {
    expect(PLAN_MODULES.completo).toEqual(
      expect.arrayContaining(["whatsapp", "ai_agent", "fornecedores"]),
    );
  });
});

describe("defaultModuleEnabled", () => {
  it("liga modulos clinicos no conecta", () => {
    expect(defaultModuleEnabled("conecta", "prontuario")).toBe(true);
    expect(defaultModuleEnabled("conecta", "procedimentos")).toBe(true);
    expect(defaultModuleEnabled("conecta", "whatsapp")).toBe(false);
  });

  it("liga whatsapp no completo mas nao ai_agent", () => {
    expect(defaultModuleEnabled("completo", "whatsapp")).toBe(true);
    expect(defaultModuleEnabled("completo", "ai_agent")).toBe(false);
  });

  it("isModuleEnabledForPlan reflete PLAN_MODULES", () => {
    expect(isModuleEnabledForPlan("essencial", "prontuario")).toBe(false);
    expect(isModuleEnabledForPlan("completo", "fornecedores")).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar testes — devem falhar**

Run: `npm run test -- src/lib/billing/plans.test.ts`  
Expected: FAIL (conecta ainda tem whatsapp, etc.)

- [ ] **Step 3: Atualizar `plans.ts`**

Substituir `PLAN_MODULES`:

```typescript
export const PLAN_MODULES: Record<PlanKey, ModuleKey[]> = {
  essencial: ["agenda", "pacientes"],
  conecta: ["agenda", "pacientes", "prontuario", "procedimentos"],
  inteligente: [
    "agenda",
    "pacientes",
    "prontuario",
    "procedimentos",
    "estoque",
    "financeiro",
  ],
  completo: [
    "agenda",
    "pacientes",
    "prontuario",
    "procedimentos",
    "estoque",
    "financeiro",
    "fornecedores",
    "whatsapp",
    "ai_agent",
  ],
};
```

Adicionar taglines:

```typescript
export const PLAN_TAGLINES: Record<PlanKey, string> = {
  essencial: "Agenda + Pacientes",
  conecta: "Prontuário + procedimentos",
  inteligente: "Estoque + financeiro",
  completo: "WhatsApp + IA + fornecedores",
};
```

Simplificar `defaultModuleEnabled`:

```typescript
export function defaultModuleEnabled(
  planKey: PlanKey,
  moduleKey: ModuleKey,
): boolean {
  if (!isModuleEnabledForPlan(planKey, moduleKey)) return false;
  if (moduleKey === "ai_agent") return false;
  return true;
}
```

- [ ] **Step 4: Rodar testes — devem passar**

Run: `npm run test -- src/lib/billing/plans.test.ts`  
Expected: PASS

---

## Task 2: Fair use caps

**Files:**
- Modify: `src/modules/admin/usage.ts`
- Modify: `src/modules/admin/usage.test.ts`

- [ ] **Step 1: Atualizar testes de caps**

Em `usage.test.ts`, alterar:

```typescript
it("conecta sem caps de whatsapp ou ia", () => {
  expect(FAIR_USE_CAPS.conecta).toEqual({ whatsapp: null, ai: null });
});

it("inteligente sem caps de whatsapp ou ia", () => {
  expect(FAIR_USE_CAPS.inteligente).toEqual({ whatsapp: null, ai: null });
});
```

Remover ou ajustar teste `getFairUseCaps("conecta")` que espera 1200.

- [ ] **Step 2: Rodar testes — devem falhar**

Run: `npm run test -- src/modules/admin/usage.test.ts`

- [ ] **Step 3: Atualizar `FAIR_USE_CAPS`**

```typescript
export const FAIR_USE_CAPS: Record<PlanKey, FairUseCaps> = {
  essencial: { whatsapp: null, ai: null },
  conecta: { whatsapp: null, ai: null },
  inteligente: { whatsapp: null, ai: null },
  completo: { whatsapp: 2500, ai: 3500 },
};
```

- [ ] **Step 4: Rodar testes — devem passar**

Run: `npm run test -- src/modules/admin/usage.test.ts`

---

## Task 3: Copy comercial `/visao`

**Files:**
- Modify: `src/lib/commercial/visao-content.ts`

- [ ] **Step 1: Atualizar `FUTURE_MODULES`**

- WhatsApp real → plano **Completo**
- Prontuário / Procedimentos → plano **Conecta+**
- Estoque / Financeiro → plano **Inteligente+**
- Agente IA → plano **Completo**

- [ ] **Step 2: Reescrever array `PLANS`**

Exemplo Conecta:

```typescript
{
  name: "Conecta",
  price: "R$ 149",
  tagline: "Clínica digital",
  description:
    "Prontuário e procedimentos no mesmo sistema da agenda — sem depender de papel ou planilhas.",
  features: [
    "Tudo do plano Essencial",
    "Prontuário eletrônico",
    "Catálogo de procedimentos",
    "Até 3 dentistas",
  ],
  addsFromPrevious: "Inclui prontuário e procedimentos",
  highlight: false,
},
```

Inteligente: destaque estoque + financeiro (sem IA).  
Completo: WhatsApp + IA + fornecedores + tudo anterior.  
Manter `highlight: true` no Inteligente ou mover para Completo conforme narrativa (recomendado: **Inteligente** continua highlight como "gestão").

- [ ] **Step 3: Verificar visualmente**

Run: `npm run dev` → abrir `/visao` e confirmar textos.

---

## Task 4: Taglines no cadastro

**Files:**
- Modify: `src/app/cadastro/cadastro-form.tsx`

- [ ] **Step 1: Importar `PLAN_TAGLINES`**

- [ ] **Step 2: Exibir tagline abaixo do nome do plano**

Dentro do `<label>` de cada plano, após `PLAN_LABELS[key]`:

```tsx
<span className="block text-xs font-normal text-muted-foreground">
  {PLAN_TAGLINES[key]}
</span>
```

- [ ] **Step 3: Smoke manual**

Abrir `/cadastro` — cada plano mostra tagline alinhada à matriz nova.

---

## Task 5: Nota na spec comercial legada

**Files:**
- Modify: `docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md` (topo, após título)

- [ ] **Step 1: Adicionar bloco**

```markdown
> **Atualização 2026-07-07:** A matriz plano × módulo em §7.3 foi **superseded** por `docs/superpowers/specs/2026-07-07-plan-reposition-design.md` (WhatsApp/IA só Completo). Preços §3.4 permanecem válidos.
```

---

## Task 6: Verificação final

- [ ] **Step 1: Suite completa**

Run: `npm run test`  
Expected: all pass

- [ ] **Step 2: Build**

Run: `npm run build`  
Expected: success

- [ ] **Step 3: Smoke signup (opcional, se env local OK)**

Criar conta teste plano Conecta → verificar no Supabase que `clinic_modules` tem `prontuario`/`procedimentos` enabled e `whatsapp` disabled.

- [ ] **Step 4: Confirmar grandfather**

Clínica Smoke existente: módulos **não** alterados sem ação do super admin.

---

## Checklist spec → plano

| Requisito spec | Task |
|----------------|------|
| Matriz §4 | Task 1 |
| defaultModuleEnabled §5 | Task 1 |
| Grandfather §7 | Task 6 (sem SQL) |
| Fair use §6 | Task 2 |
| Copy visao | Task 3 |
| Cadastro taglines | Task 4 |
| Nota spec legada | Task 5 |
