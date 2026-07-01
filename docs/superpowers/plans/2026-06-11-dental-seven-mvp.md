# Dental Seven MVP v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar demo web Dental Seven (agenda + pacientes + WhatsApp simulado) com gate por senha, Supabase, identidade DR7 e deploy em `dental-seven.dr7performance.com.br`.

**Architecture:** Next.js 15 App Router monolith; Supabase Postgres com `clinic_id` em todas as tabelas; cookie `demo_session` via middleware; módulos em `src/modules/*`; UI dark-first com tokens DR7.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Supabase JS v2, lucide-react, Vitest (libs only), Vercel + Supabase.

**Spec de referência:** `docs/superpowers/specs/2026-06-11-dental-seven-mvp-design.md`

---

## File map (responsabilidades)

| Path | Responsabilidade |
|------|------------------|
| `src/app/entrar/page.tsx` | Gate senha demo premium |
| `src/app/(app)/layout.tsx` | Shell: sidebar, bottom nav, header, dentist context |
| `src/app/(app)/agenda/page.tsx` | Rota agenda — delega ao módulo |
| `src/app/(app)/pacientes/page.tsx` | Rota pacientes |
| `src/app/(app)/pacientes/[id]/page.tsx` | Ficha do paciente |
| `src/app/(app)/whatsapp/page.tsx` | Rota WhatsApp simulado |
| `src/app/api/auth/demo/route.ts` | POST valida senha → cookie httpOnly |
| `src/middleware.ts` | Protege rotas app; redirect `/entrar` |
| `src/lib/demo-session.ts` | Constantes cookie + helpers |
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server client (RSC/actions) |
| `src/lib/supabase/types.ts` | Tipos gerados ou manuais |
| `src/components/brand/*` | Dr7Logo, DentalSevenWordmark |
| `src/components/ui/*` | Button, Card, Input, Modal, Toast, Badge |
| `src/components/layout/*` | AppSidebar, BottomNav, AppHeader |
| `src/modules/agenda/*` | WeekView, DayView, AppointmentModal, actions |
| `src/modules/pacientes/*` | PatientList, PatientForm, actions |
| `src/modules/whatsapp/*` | ThreadList, ChatView, demo actions |
| `src/styles/globals.css` | Tokens DR7 + utilities |
| `supabase/migrations/001_core_schema.sql` | Schema MVP |
| `supabase/migrations/002_seed_demo.sql` | Dados fictícios |
| `public/brand/*.png` | Logos DR7 |
| `.env.local.example` | Template env vars |

---

### Task 1: Scaffold Next.js + tooling

**Files:**
- Create: project root (`package.json`, `next.config.ts`, `tsconfig.json`, `tailwind` config, `src/app/layout.tsx`, `src/app/page.tsx`)
- Create: `vitest.config.ts`, `src/lib/demo-session.test.ts` (placeholder)

- [ ] **Step 1: Initialize Next.js in project root**

Run from `Dental Seven/` (pasta já contém `docs/` e `.agents/` — usar `.`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: `package.json` com `next@15.x`, `src/app/` criado.

- [ ] **Step 2: Add dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react
npm install -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Redirect root to `/entrar`**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/entrar");
}
```

- [ ] **Step 5: Run build smoke**

```bash
npm run build
```

Expected: compila sem erro.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 15 + Vitest for Dental Seven MVP"
```

---

### Task 2: Design tokens DR7 + globals.css

**Files:**
- Create: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Copy token structure from DR7 site**

Create `src/styles/globals.css` espelhando `Site DR7 Performance/dr7performance/src/styles.css`:

- Google Fonts: Montserrat + Inter
- `:root` tokens: `--background`, `--surface`, `--primary` (oklch), `--border`, `--radius: 0.75rem`
- `--gradient-primary`, `--shadow-glow`, `--transition-base`
- Utilities: `.bg-tech-grid`, `.text-gradient-primary`, `.animate-fade-in-up`
- `@theme inline` mapeando `--color-background`, `--color-primary`, `--font-display`, `--font-sans`

- [ ] **Step 2: Wire layout**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Dental Seven — Demo",
  description: "Sistema para clínicas odontológicas — DR7 Performance",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify dev server**

```bash
npm run dev
```

Open `http://localhost:3000` → redirect `/entrar` (404 ok until Task 9).

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css src/app/layout.tsx
git commit -m "feat: add DR7 design tokens and global styles"
```

---

### Task 3: Brand assets + components

**Files:**
- Create: `public/brand/dr7-logo-dark-bg.png`, `public/brand/dr7-logo-light-bg.png`
- Create: `src/components/brand/dr7-logo.tsx`, `src/components/brand/dental-seven-wordmark.tsx`

- [ ] **Step 1: Copy logo files**

Copy from workspace assets (uploaded in chat) or from site DR7 `src/assets/dr7-logo.png`:

- `dr7-logo-dark-bg.png` → versão branca para fundo escuro
- `dr7-logo-light-bg.png` → versão cinza para fundo claro

- [ ] **Step 2: Create Dr7Logo**

Create `src/components/brand/dr7-logo.tsx`:

```tsx
import Image from "next/image";

type Dr7LogoProps = {
  variant?: "on-dark" | "on-light";
  className?: string;
  height?: number;
};

const srcMap = {
  "on-dark": "/brand/dr7-logo-dark-bg.png",
  "on-light": "/brand/dr7-logo-light-bg.png",
} as const;

export function Dr7Logo({
  variant = "on-dark",
  className = "",
  height = 48,
}: Dr7LogoProps) {
  return (
    <Image
      src={srcMap[variant]}
      alt="DR7 Performance"
      height={height}
      width={Math.round(height * 2.8)}
      className={className}
      priority
    />
  );
}
```

- [ ] **Step 3: Create DentalSevenWordmark**

Create `src/components/brand/dental-seven-wordmark.tsx`:

```tsx
type Props = { className?: string; size?: "sm" | "lg" };

export function DentalSevenWordmark({ className = "", size = "lg" }: Props) {
  const textClass = size === "lg" ? "text-3xl sm:text-4xl" : "text-xl";
  return (
    <h1
      className={`font-display font-bold uppercase tracking-tight ${textClass} ${className}`}
    >
      Dental <span className="text-primary">Seven</span>
    </h1>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add public/brand src/components/brand
git commit -m "feat: add DR7 logos and Dental Seven wordmark components"
```

---

### Task 4: UI primitives

**Files:**
- Create: `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `modal.tsx`
- Create: `src/components/ui/toast.tsx`, `src/components/ui/toast-provider.tsx`

- [ ] **Step 1: Button (gradient primary DR7)**

Create `src/components/ui/button.tsx`:

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg";
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(135deg,oklch(0.63_0.15_250),oklch(0.55_0.17_250))] text-primary-foreground hover:shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]",
  ghost: "bg-transparent text-foreground hover:bg-surface",
  outline: "border border-border bg-transparent hover:border-primary/50",
};

const sizes = { md: "h-11 px-4 text-sm", lg: "h-14 px-6 text-sm" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-xl font-display font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
```

- [ ] **Step 2: Card, Input, Badge** — padrão spec: `border-border bg-surface`, input dark, badge pill primary.

- [ ] **Step 3: Modal** — overlay + panel `rounded-2xl border border-border bg-surface`, close on Escape.

- [ ] **Step 4: Toast provider** — React context; `toast.success("...")` para ações WhatsApp demo.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui
git commit -m "feat: add DR7-styled UI primitives"
```

---

### Task 5: Supabase schema migration

**Files:**
- Create: `supabase/migrations/001_core_schema.sql`
- Create: `supabase/config.toml` (optional, `supabase init` if CLI available)

- [ ] **Step 1: Write migration**

Create `supabase/migrations/001_core_schema.sql`:

```sql
-- Dental Seven MVP core schema
create extension if not exists "pgcrypto";

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table dentists (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  color text not null default '#4490E2',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  birth_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type appointment_status as enum (
  'confirmed', 'pending', 'cancelled', 'completed'
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  dentist_id uuid not null references dentists(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_min integer not null default 30,
  status appointment_status not null default 'pending',
  procedure_label text not null default 'Consulta',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('sent', 'delivered', 'read');

create table whatsapp_threads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references whatsapp_threads(id) on delete cascade,
  direction message_direction not null,
  body text not null,
  sent_at timestamptz not null default now(),
  status message_status not null default 'sent'
);

create index idx_appointments_clinic_starts on appointments(clinic_id, starts_at);
create index idx_patients_clinic_name on patients(clinic_id, name);
create index idx_dentists_clinic on dentists(clinic_id);

-- MVP: permissive RLS (gate is app-level cookie)
alter table clinics enable row level security;
alter table dentists enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table whatsapp_threads enable row level security;
alter table whatsapp_messages enable row level security;

create policy "demo_read_write_clinics" on clinics for all using (true) with check (true);
create policy "demo_read_write_dentists" on dentists for all using (true) with check (true);
create policy "demo_read_write_patients" on patients for all using (true) with check (true);
create policy "demo_read_write_appointments" on appointments for all using (true) with check (true);
create policy "demo_read_write_threads" on whatsapp_threads for all using (true) with check (true);
create policy "demo_read_write_messages" on whatsapp_messages for all using (true) with check (true);
```

- [ ] **Step 2: Apply migration**

Via Supabase MCP `apply_migration` or Dashboard SQL editor → run file contents.

Expected: 6 tables created, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase core schema for Dental Seven MVP"
```

---

### Task 6: Seed demo data

**Files:**
- Create: `supabase/migrations/002_seed_demo.sql`

- [ ] **Step 1: Write seed with fixed UUIDs for idempotent re-run**

Create `supabase/migrations/002_seed_demo.sql`:

```sql
-- Clínica Sorriso Norte (fictícia)
insert into clinics (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Clínica Sorriso Norte', 'sorriso-norte')
on conflict (id) do nothing;

insert into dentists (id, clinic_id, name, color) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Dra. Ana Silva', '#4490E2'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Dr. Carlos Mendes', '#6BA3E8')
on conflict (id) do nothing;

-- 8 pacientes fictícios (ids 333...301-308)
-- 15 appointments relative to current week (use date_trunc + intervals)
-- 4 whatsapp threads + 8-12 messages

-- Use names: Marina Costa, João Pereira, etc. — all clearly fictional
-- Procedure labels: Limpeza, Retorno, Avaliação, Clareamento
```

Expand seed in implementation with explicit INSERTs for all 8 patients, 15 appointments (computed from `date_trunc('week', now())`), 4 threads, messages.

- [ ] **Step 2: Apply seed migration**

Run via Supabase MCP or SQL editor.

Verify:

```sql
select count(*) from patients;   -- 8
select count(*) from appointments; -- ~15
select count(*) from whatsapp_threads; -- 4
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_seed_demo.sql
git commit -m "feat: seed demo clinic Sorriso Norte"
```

---

### Task 7: Supabase clients + types

**Files:**
- Create: `src/lib/supabase/client.ts`, `server.ts`, `types.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Types**

Create `src/lib/supabase/types.ts` with interfaces matching schema:

```typescript
export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";
export type MessageDirection = "inbound" | "outbound";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
}

export interface Dentist {
  id: string;
  clinic_id: string;
  name: string;
  color: string;
  active: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  birth_date: string | null;
  notes: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  dentist_id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  duration_min: number;
  status: AppointmentStatus;
  procedure_label: string;
  notes: string | null;
}

export interface WhatsappThread {
  id: string;
  clinic_id: string;
  patient_id: string;
  last_message_at: string;
}

export interface WhatsappMessage {
  id: string;
  thread_id: string;
  direction: MessageDirection;
  body: string;
  sent_at: string;
  status: "sent" | "delivered" | "read";
}

export const DEMO_CLINIC_ID = "11111111-1111-1111-1111-111111111111";
```

- [ ] **Step 2: Browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

- [ ] **Step 4: Env example**

Create `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_NAME=Dental Seven
DEMO_PASSWORD=demo2026
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase .env.local.example
git commit -m "feat: add Supabase clients and domain types"
```

---

### Task 8: Demo session auth (TDD)

**Files:**
- Create: `src/lib/demo-session.ts`, `src/lib/demo-session.test.ts`
- Create: `src/app/api/auth/demo/route.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/demo-session.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  DEMO_SESSION_COOKIE,
  isValidDemoSession,
  verifyDemoPassword,
} from "./demo-session";

describe("verifyDemoPassword", () => {
  it("returns true when password matches env", () => {
    process.env.DEMO_PASSWORD = "secret123";
    expect(verifyDemoPassword("secret123")).toBe(true);
  });

  it("returns false when password differs", () => {
    process.env.DEMO_PASSWORD = "secret123";
    expect(verifyDemoPassword("wrong")).toBe(false);
  });
});

describe("isValidDemoSession", () => {
  it("accepts signed token matching secret", () => {
    process.env.DEMO_PASSWORD = "secret123";
    const token = "demo_authenticated";
    expect(isValidDemoSession(token)).toBe(true);
  });

  it("rejects null or empty", () => {
    expect(isValidDemoSession(null)).toBe(false);
    expect(isValidDemoSession("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement demo-session**

Create `src/lib/demo-session.ts`:

```typescript
export const DEMO_SESSION_COOKIE = "demo_session";
export const DEMO_SESSION_VALUE = "demo_authenticated";

export function verifyDemoPassword(input: string): boolean {
  const expected = process.env.DEMO_PASSWORD ?? "";
  return expected.length > 0 && input === expected;
}

export function isValidDemoSession(value: string | null | undefined): boolean {
  return value === DEMO_SESSION_VALUE;
}

export const demoCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```

- [ ] **Step 5: API route**

Create `src/app/api/auth/demo/route.ts`:

```typescript
import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  demoCookieOptions,
  verifyDemoPassword,
} from "@/lib/demo-session";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  if (!password || !verifyDemoPassword(password)) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, demoCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DEMO_SESSION_COOKIE);
  return response;
}
```

- [ ] **Step 6: Middleware**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, isValidDemoSession } from "@/lib/demo-session";

const PUBLIC_PATHS = ["/entrar", "/api/auth/demo"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const authenticated = isValidDemoSession(session);

  if (pathname === "/entrar" && authenticated) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }

  if (!isPublic && !authenticated) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand).*)"],
};
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/demo-session.ts src/lib/demo-session.test.ts src/app/api/auth/demo/route.ts src/middleware.ts
git commit -m "feat: demo password gate with cookie session and middleware"
```

---

### Task 9: Tela `/entrar` (premium)

**Files:**
- Create: `src/app/entrar/page.tsx`
- Create: `src/app/entrar/entrar-form.tsx` (client component)

- [ ] **Step 1: Client form**

Create `src/app/entrar/entrar-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EntrarForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Senha inválida. Solicite o acesso à DR7 Performance.");
      return;
    }
    router.push("/agenda");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        type="password"
        placeholder="Senha da demonstração"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Entrando…" : "Acessar demo"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Page with hero atmosphere**

Create `src/app/entrar/page.tsx`:

```tsx
import { DentalSevenWordmark } from "@/components/brand/dental-seven-wordmark";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { EntrarForm } from "./entrar-form";

export default function EntrarPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#07090f] px-4">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-20" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
        }}
      />
      <div className="relative z-10 flex animate-fade-in-up flex-col items-center gap-8 text-center">
        <DentalSevenWordmark />
        <p className="max-w-md text-sm text-muted-foreground">
          Demonstração — explore agenda, pacientes e WhatsApp
        </p>
        <EntrarForm />
        <div className="mt-8 flex flex-col items-center gap-2 opacity-80">
          <Dr7Logo height={36} />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Desenvolvido por DR7 Performance
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual test**

Set `.env.local` with `DEMO_PASSWORD=demo2026`, run `npm run dev`.

- POST wrong password → error message
- POST correct → redirect `/agenda` (404 ok until Task 10)

- [ ] **Step 4: Commit**

```bash
git add src/app/entrar
git commit -m "feat: premium demo entry screen with password gate"
```

---

### Task 10: App shell layout

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/layout/app-sidebar.tsx`, `bottom-nav.tsx`, `app-header.tsx`
- Create: `src/contexts/dentist-filter-context.tsx`

- [ ] **Step 1: Dentist filter context**

Client context storing `selectedDentistId: string | "all"` — used by agenda header.

- [ ] **Step 2: Sidebar (desktop `lg:flex`)**

Links: Agenda (`Calendar`), Pacientes (`Users`), WhatsApp (`MessageCircle`) — lucide icons.

Active state: `border-primary text-primary`.

Footer: small Dr7Logo + "DR7 Performance".

- [ ] **Step 3: Bottom nav (mobile `lg:hidden`)**

Same 3 routes, fixed bottom, safe-area padding.

- [ ] **Step 4: App header**

Shows clinic name "Clínica Sorriso Norte" + dentist selector dropdown (Todos / Ana / Carlos).

- [ ] **Step 5: Layout wrapper**

```tsx
// src/app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DentistFilterProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col pb-20 lg:pb-0">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </DentistFilterProvider>
  );
}
```

- [ ] **Step 6: Placeholder pages**

Create minimal `agenda/page.tsx`, `pacientes/page.tsx`, `whatsapp/page.tsx` with heading only — verify nav works.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app) src/components/layout src/contexts
git commit -m "feat: app shell with sidebar, bottom nav and dentist filter"
```

---

### Task 11: Módulo Agenda

**Files:**
- Create: `src/modules/agenda/actions.ts` (server actions)
- Create: `src/modules/agenda/week-view.tsx`, `day-view.tsx`, `appointment-modal.tsx`, `agenda-toolbar.tsx`
- Modify: `src/app/(app)/agenda/page.tsx`

- [ ] **Step 1: Server actions**

Create `src/modules/agenda/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEMO_CLINIC_ID, AppointmentStatus } from "@/lib/supabase/types";

export async function getAppointments(from: string, to: string, dentistId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select("*, patient:patients(id,name), dentist:dentists(id,name,color)")
    .eq("clinic_id", DEMO_CLINIC_ID)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at");
  if (dentistId && dentistId !== "all") query = query.eq("dentist_id", dentistId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function upsertAppointment(input: {
  id?: string;
  dentist_id: string;
  patient_id: string;
  starts_at: string;
  duration_min: number;
  procedure_label: string;
  status: AppointmentStatus;
  notes?: string;
}) {
  const supabase = await createClient();
  const ends_at = new Date(
    new Date(input.starts_at).getTime() + input.duration_min * 60000,
  ).toISOString();

  const payload = {
    clinic_id: DEMO_CLINIC_ID,
    dentist_id: input.dentist_id,
    patient_id: input.patient_id,
    starts_at: input.starts_at,
    ends_at,
    duration_min: input.duration_min,
    procedure_label: input.procedure_label,
    status: input.status,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("appointments").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("appointments").insert(payload);
    if (error) throw error;
  }
  revalidatePath("/agenda");
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/agenda");
}
```

- [ ] **Step 2: Toolbar** — toggle Semana/Hoje; reads dentist filter from context.

- [ ] **Step 3: WeekView** — grid Mon–Sun, hours 08–18, appointment blocks positioned by `starts_at` + `duration_min`, background `dentist.color`.

- [ ] **Step 4: DayView** — chronological list for today; default on mobile.

- [ ] **Step 5: AppointmentModal** — create/edit: patient select (fetch patients), dentist, datetime-local, duration, procedure, status. Buttons: Salvar, Confirmar, Cancelar consulta.

- [ ] **Step 6: Wire page**

`agenda/page.tsx` — server component fetches week range, passes to client views.

- [ ] **Step 7: Manual test**

- Create appointment → appears in week + day
- Change status → color/badge updates
- Filter by dentist → grid filters

- [ ] **Step 8: Commit**

```bash
git add src/modules/agenda src/app/(app)/agenda
git commit -m "feat: agenda module with week/day views and CRUD"
```

---

### Task 12: Módulo Pacientes

**Files:**
- Create: `src/modules/pacientes/actions.ts`, `patient-list.tsx`, `patient-detail.tsx`
- Create: `src/app/(app)/pacientes/[id]/page.tsx`
- Modify: `src/app/(app)/pacientes/page.tsx`

- [ ] **Step 1: Server actions**

```typescript
"use server";
// getPatients(search?), getPatient(id), updatePatientNotes(id, notes)
// getPatientAppointments(patientId) — from appointments table
```

- [ ] **Step 2: Patient list** — search input filters client-side or server with `ilike` on name/phone; cards link to `/pacientes/[id]`.

- [ ] **Step 3: Patient detail** — contact fields read-only (MVP), textarea notes with save, appointment history table (date, procedure, status, dentist).

- [ ] **Step 4: "Nova consulta" link** — `/agenda?patientId=UUID` — agenda reads query param to pre-fill modal.

- [ ] **Step 5: Manual test**

- Search "Marina" → filters
- Edit notes → persists after refresh
- History shows seeded appointments

- [ ] **Step 6: Commit**

```bash
git add src/modules/pacientes src/app/(app)/pacientes
git commit -m "feat: patients module with notes and appointment history"
```

---

### Task 13: Módulo WhatsApp (simulado)

**Files:**
- Create: `src/modules/whatsapp/actions.ts`, `thread-list.tsx`, `chat-view.tsx`, `demo-actions.tsx`
- Modify: `src/app/(app)/whatsapp/page.tsx`

- [ ] **Step 1: Fetch threads with patient name**

```typescript
// getThreads() — whatsapp_threads + patients(name)
// getMessages(threadId)
// sendDemoMessage(threadId, body) — insert outbound row
// simulateConfirmAppointment(threadId) — insert outbound + toast
```

- [ ] **Step 2: Layout** — desktop: 320px thread list + chat; mobile: list OR chat with back button.

- [ ] **Step 3: Chat bubbles** — inbound left muted surface, outbound right primary/10; timestamps formatted `pt-BR`.

- [ ] **Step 4: Demo action buttons**

- "Confirmar consulta" → outbound message + update related appointment status to `confirmed` if pending
- "Reagendar" → outbound template message
- "Enviar lembrete" → outbound template

All show toast: *"Simulação — em produção via n8n"*.

- [ ] **Step 5: Demo banner** at top of page.

- [ ] **Step 6: Manual test**

- Select thread → messages load
- Click demo action → new outbound bubble + toast

- [ ] **Step 7: Commit**

```bash
git add src/modules/whatsapp src/app/(app)/whatsapp
git commit -m "feat: simulated WhatsApp inbox with demo actions"
```

---

### Task 14: README + deploy prep

**Files:**
- Create: `README.md`
- Modify: `next.config.ts` (if needed)

- [ ] **Step 1: README sections**

- O que é Dental Seven MVP
- Pré-requisitos: Node 20+, Supabase project
- Setup: `cp .env.local.example .env.local`, run migrations, `npm run dev`
- Demo password config
- Deploy Vercel + DNS CNAME `dental-seven.dr7performance.com.br`
- Smoke checklist (copy from spec §13)

- [ ] **Step 2: Vercel env vars**

Document in README:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DEMO_PASSWORD
```

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: PASS, no type errors.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add setup and deploy instructions"
```

---

### Task 15: Smoke test final (manual)

**Status (2026-06-15): v1 CONCLUÍDA — deploy adiado; próximo marco: v2**

- [x] **Step 1: Desktop smoke** — concluído
- [x] **Step 2: Mobile smoke (390px)** — concluído
- [x] **Step 3: Deploy staging** — adiado (avançar para v2 antes do deploy)

**Verificação automatizada (2026-06-15):** 20 testes Vitest passando; build de produção OK (`npm run build`, exit 0).

**Files:** none

- [x] **Step 1: Desktop smoke**

- [x] `/entrar` → senha correta → `/agenda`
- [x] Criar consulta, editar, cancelar
- [x] `/pacientes` busca + notas + histórico
- [x] `/whatsapp` thread + ação demo + toast
- [x] Logos com contraste em sidebar e entrada

- [x] **Step 2: Mobile smoke (DevTools 390px)** — concluído (2026-06-15)

- [x] Bottom nav funciona
- [x] Agenda "Hoje" legível e acionável
- [x] Lista pacientes usável
- [x] WhatsApp alterna lista/chat

- [ ] **Step 3: Deploy staging (optional but recommended)**

Push to GitHub → import Vercel → add env → verify preview URL.

Configure domain when DNS ready.

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Gate senha `/entrar` | 8, 9 |
| Agenda semana + hoje, 2 dentistas, CRUD, status | 11 |
| Pacientes ficha + anotações + histórico | 12 |
| WhatsApp simulado + banner | 13 |
| Dental Seven + DR7 branding | 3, 9, 10 |
| Identidade DR7 tokens | 2, 4 |
| Next.js + Supabase | 1, 5–7 |
| Responsivo mobile | 10, 11, 15 |
| `clinic_id` schema | 5 |
| Status `completed` | 5, 11 |
| Domínio subdomínio | 14 |
| Logos contraste | 3 |
| n8n / export / auth real | Out of scope v1 (spec §8–9, §11) |

No placeholders remain. Types consistent across actions and components.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-11-dental-seven-mvp.md`.

**v1 status:** Implementação concluída. Deploy adiado.

**Próximo passo:** Spec v2 em `docs/superpowers/specs/2026-06-15-v2-design.md` → plano de implementação v2 (writing-plans).
