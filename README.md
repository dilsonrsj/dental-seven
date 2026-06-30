# Dental Seven MVP

Sistema web para clínicas odontológicas pequenas (1–3 dentistas, sem recepção), desenvolvido pela **DR7 Performance**. Este repositório contém o **MVP de demonstração**: portfólio interativo para apresentações comerciais e link público compartilhável após reuniões.

## O que é o Dental Seven MVP

O MVP entrega três módulos principais com dados fictícios de uma clínica demo (*Clínica Sorriso Norte*):

| Módulo | Rota | Descrição |
|--------|------|-----------|
| **Agenda** | `/agenda` | Visão semanal e “Hoje”, CRUD de consultas, filtro por dentista |
| **Pacientes** | `/pacientes` | Lista com busca, ficha com anotações e histórico de consultas |
| **WhatsApp** | `/whatsapp` | Inbox simulada — sem API real; ações demo com toast |

O acesso é protegido por senha única na rota `/entrar` (variável `DEMO_PASSWORD`). Após login, um cookie `demo_session` libera o app.

**URLs em produção (Vercel):**

| Página | URL |
|--------|-----|
| Visão comercial | https://dental-seven-self.vercel.app/visao |
| Demo MVP | https://dental-seven-self.vercel.app/entrar |

**Stack:** Next.js 15 (App Router) · Supabase · TypeScript · Tailwind CSS

**Fora do escopo v1:** auth real, multi-clínica na UI, integração n8n/WhatsApp Business, painel SuperAdmin.

---

## Pré-requisitos

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **Projeto Supabase** ([supabase.com](https://supabase.com)) — plano gratuito é suficiente para a demo
- Conta **Vercel** (para deploy em produção)

---

## Setup local

Clone o repositório e entre na pasta do projeto. Em seguida:

### 1. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local` com os valores do seu projeto Supabase:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon/public do Supabase |
| `NEXT_PUBLIC_APP_NAME` | Não | Nome exibido no app (padrão: `Dental Seven`) |
| `DEMO_PASSWORD` | Sim | Senha única para entrar em `/entrar` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev opcional | Service role — apenas se usar scripts server-side |

### 2. Migrations no Supabase

No [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, execute **nesta ordem**:

1. `supabase/migrations/001_core_schema.sql` — schema + RLS
2. `supabase/migrations/002_seed_demo.sql` — dados fictícios da demo (*Clínica Sorriso Norte*)

> Cole e execute cada arquivo por completo antes de passar ao próximo.

### 3. Instalar dependências e rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Você será redirecionado para `/entrar` — use a senha definida em `DEMO_PASSWORD`.

---

## Senha da demo (`DEMO_PASSWORD`)

A senha controla o gate de acesso da demonstração:

```env
DEMO_PASSWORD=demo2026
```

- Defina um valor forte em **produção** (Vercel → Settings → Environment Variables).
- O valor em `.env.local.example` (`demo2026`) serve apenas como referência local.
- Sem cookie `demo_session` válido, rotas do app redirecionam para `/entrar`.

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) em `localhost:3000` |
| `npm run build` | Build de produção — valida tipos e compila o app |
| `npm run test` | Executa testes unitários (Vitest) |

Outros: `npm run start` (serve o build local), `npm run test:watch`, `npm run lint`.

---

## Deploy (Vercel + DNS)

### Vercel

1. Importe o repositório na [Vercel](https://vercel.com) como **projeto separado** do site institucional DR7.
2. Framework preset: **Next.js** (detectado automaticamente).
3. Configure as variáveis de ambiente em **Settings → Environment Variables**:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_APP_NAME=Dental Seven
   DEMO_PASSWORD
   ```

   > `SUPABASE_SERVICE_ROLE_KEY` não é necessária no deploy MVP se todas as rotas usarem a anon key.

4. Faça o deploy. URL padrão do projeto: **`https://dental-seven-self.vercel.app`**

   | Rota | Uso |
   |------|-----|
   | `/visao` | Landing comercial (pública, sem senha) |
   | `/entrar` | Gate da demo interativa |

### Domínio customizado (futuro)

**URL oficial da demo:** `https://dental-seven.dr7performance.com.br`

1. Vercel → projeto Dental Seven → **Settings → Domains** → adicionar `dental-seven.dr7performance.com.br`.
2. No registrador DNS de `dr7performance.com.br`, crie um registro **CNAME**:

   | Tipo | Nome | Valor |
   |------|------|-------|
   | CNAME | `dental-seven` | `cname.vercel-dns.com` *(ou o valor indicado pela Vercel)* |

3. Aguarde propagação DNS e emissão automática de SSL pela Vercel.

O site DR7 pode linkar a demo no portfólio: *“Experimente a demo → dental-seven.dr7performance.com.br”*.

---

## Smoke checklist (validação manual)

Use esta lista após setup local ou deploy para confirmar que o MVP está funcional:

- [ ] Entrar com senha em `/entrar` → acesso ao app (`/agenda`)
- [ ] CRUD de consulta na agenda (criar, editar, cancelar)
- [ ] Ver e editar ficha de paciente em `/pacientes`
- [ ] Abrir thread WhatsApp simulada em `/whatsapp` + ação demo (toast)
- [ ] Agenda “Hoje” e lista de pacientes usáveis no celular (DevTools ~390px)

Sem suite E2E automatizada no MVP — validação manual é suficiente.

---

## Estrutura do projeto

```
dental-seven/
├── public/brand/           # Logos DR7
├── src/
│   ├── app/                # Rotas (entrar, agenda, pacientes, whatsapp, API)
│   ├── components/         # UI e marca
│   ├── lib/                # Supabase, sessão demo
│   └── modules/            # Lógica por módulo
├── supabase/migrations/    # 001 schema · 002 seed
└── docs/superpowers/specs/ # Spec de design MVP
```

---

## Documentação adicional

- Spec MVP: [`docs/superpowers/specs/2026-06-11-dental-seven-mvp-design.md`](docs/superpowers/specs/2026-06-11-dental-seven-mvp-design.md)
- **Preços oficiais (§3.4):** [`docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md`](docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md)
- Kit comercial: [`docs/comercial/kit-apresentacao-cliente.md`](docs/comercial/kit-apresentacao-cliente.md)
- Visão do produto (clientes): https://dental-seven-self.vercel.app/visao

---

*Dental Seven — DR7 Performance. MVP v1.*
