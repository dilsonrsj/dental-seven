# Founding resume → login Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Porta única `/founding`; dentista com clínica retoma via e-mail+WhatsApp e vai a `/entrar`; SuperAdmin no mesmo fluxo.

**Architecture:** Middleware exige cookie founding em `/entrar` e `/cadastro` e redireciona anônimos protegidos para `/founding`. Nova action `resumeFoundingForLogin` + UI curta no formulário; seed SuperAdmin em `beta_founders`.

**Tech Stack:** Next.js middleware, server actions, Supabase admin client, Vitest

---

### Task 1: Action de retomada + testes

**Files:**
- Modify: `src/lib/founding/actions.ts`
- Modify: `src/lib/founding/founding-resume.test.ts` (ou novo teste da action pura se extrair)
- Create: lógica já usa `assertFoundingResumeAllowed`

- [ ] **Step 1:** `resumeFoundingForLogin({ email, whatsapp })` — lookup + assert + set cookie
- [ ] **Step 2:** Erros genéricos para e-mail inexistente / WhatsApp divergente
- [ ] **Step 3:** Testes unitários do assert (já existem); commit

### Task 2: UI em `/founding`

**Files:**
- Modify: `src/app/founding/founding-form.tsx`

- [ ] **Step 1:** Toggle “Já criei minha clínica — quero entrar”
- [ ] **Step 2:** Form e-mail + WhatsApp → action → `router.push('/entrar')`
- [ ] **Step 3:** Commit

### Task 3: Middleware + páginas

**Files:**
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/entrar/page.tsx`
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1:** Gate `/entrar` + `/cadastro` sem cookie → `/founding`
- [ ] **Step 2:** Anônimos em rotas protegidas → `/founding`
- [ ] **Step 3:** `EntrarPage` redirect se beta sem cookie
- [ ] **Step 4:** AppShell `redirect("/founding")` se beta e sem ctx
- [ ] **Step 5:** Commit

### Task 4: Seed SuperAdmin + docs + deploy

**Files:**
- Create: `supabase/migrations/029_seed_superadmin_founder.sql` (ou script SQL)
- Modify: `docs/superpowers/GUIA-MASTER.md` §2 / §5

- [ ] **Step 1:** INSERT idempotente `superadmin-smoke@dr7.app` + WhatsApp DR7
- [ ] **Step 2:** Aplicar no remoto (MCP/SQL)
- [ ] **Step 3:** Atualizar GUIA-MASTER
- [ ] **Step 4:** Deploy produção e smoke `/admin` → `/founding` → resume → `/entrar`
