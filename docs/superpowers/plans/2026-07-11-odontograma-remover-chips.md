# Remover chips do odontograma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover informações redundantes exibidas abaixo do odontograma.

**Architecture:** Alteração estritamente visual no componente orquestrador. A lógica clínica, o SVG e o painel de detalhes permanecem inalterados.

**Tech Stack:** React 19, Next.js 15, TypeScript, Tailwind CSS.

---

### Task 1: Remover chips informativos

**Files:**
- Modify: `src/modules/prontuario/odontogram/viewers/odontogram-section.tsx`

- [ ] Remover a constante `FEATURE_CHIPS`.
- [ ] Remover o bloco JSX que renderiza os quatro chips.
- [ ] Executar ESLint no arquivo e confirmar ausência de erros.
