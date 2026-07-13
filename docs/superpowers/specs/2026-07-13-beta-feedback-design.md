# Beta end date + formulário de feedback

**Versão:** 1.0  
**Data:** 2026-07-13  
**Status:** Design aprovado (storage opção 1 — 2026-07-13) — **implementado**
**Branch:** `feat/v2`

---

## Decisões

| Tema | Decisão |
|------|---------|
| Fim da beta | **07/08/2026** (constantes em `src/lib/founding/content.ts`) |
| Copy pós-data | Após essa data, o acesso beta termina e abrimos a condição exclusiva de founding member (desconto nos primeiros meses). |
| Feedback UX | Rota `/feedback`; item na sidebar + link no banner; só com `DENTAL_SEVEN_BETA_GATE=true` |
| Persistência | Tabela `beta_feedback` + lista no Super Admin (`/admin/founding`) |
| Notificação | Opcional leve: e-mail à DR7 no submit (mesmo padrão founding-notify); falha de e-mail não bloqueia save |

---

## 1. Banner e `/founding`

### Banner (`BetaBanner`)

Texto na linha (ou quebra mobile):

- “Você está na versão beta — disponível até **07/08/2026**.”
- “Após essa data, o acesso beta termina e abrimos a condição exclusiva de founding member (desconto nos primeiros meses).”
- Link **Enviar feedback** → `/feedback` (não só WhatsApp). WhatsApp pode ficar como secundário no rodapé de `/feedback`.

### `/founding`

- Bloco `betaWindow` (já existe): alinhar body ao copy acima (mesma frase canônica + data via `BETA_ENDS_*`).
- Expectativas: citar formulário in-app (`/feedback`) além de WhatsApp.

Fonte única: `BETA_ENDS_AT` / `BETA_ENDS_LABEL` / `BETA_ENDS_SHORT` + strings em `FOUNDING_CONTENT`.

---

## 2. Rota `/feedback` (app autenticado)

- Prefixo em `CLINIC_APP_PREFIXES`.
- Gate: se `!isBetaGateEnabled()`, redirect `/ajuda` ou `/agenda`.
- Layout: mesma vibe do app (shell); formulário claro, não marketing page.
- Sidebar: item **“Enviar feedback”** (ícone MessageSquarePlus / similar), só quando gate on; posicionar perto de Guia rápido.
- Banner: link para `/feedback`.

### Campos

| # | Campo | Tipo | Obrigatório |
|---|--------|------|-------------|
| 1 | `nps` | 0–10 (radio/scale) — “Recomendaria o Dental Seven a um colega?” | Sim |
| 2 | `top_module` | enum: `agenda` \| `pacientes` \| `prontuario` \| `outro` | Sim |
| 3 | `liked_most` | text curto (máx. 500) | Sim |
| 4 | `blocked_or_missing` | text curto (máx. 500) | Sim |
| 5 | `would_use_today` | `yes` \| `maybe` \| `no` | Sim |
| 6 | `notes` | text (máx. 2000) — “Observações gerais” | Não |

### Pós-envio

- Toast “Obrigado — recebemos seu feedback”.
- Estado na página: mensagem de sucesso + botão “Enviar outro feedback” (limpa form).
- Pode enviar múltiplas vezes (sem limite rígido na beta).

### Autoria

Server action grava `clinic_id`, `profile_id` (user), e-mail/nome se disponíveis via auth context. Sem clinic/profile → erro amigável.

---

## 3. Schema `beta_feedback`

Migration nova (ex.: `028_beta_feedback.sql`):

```sql
create table beta_feedback (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete set null,
  profile_id uuid references profiles(id) on delete set null,
  nps smallint not null check (nps between 0 and 10),
  top_module text not null check (top_module in ('agenda', 'pacientes', 'prontuario', 'outro')),
  liked_most text not null,
  blocked_or_missing text not null,
  would_use_today text not null check (would_use_today in ('yes', 'maybe', 'no')),
  notes text,
  created_at timestamptz not null default now()
);

-- RLS on; sem policies para anon/authenticated — insert/select via service role nas server actions.
```

Índices: `created_at desc`, `clinic_id`.

---

## 4. Super Admin

Em `/admin/founding`:

- Seção **“Feedbacks recebidos”** abaixo da lista de founders (ou tabs Founders | Feedbacks).
- Tabela: data, clínica (nome se join), NPS, módulo, usaria hoje, trechos liked/blocked (truncate), link “ver” expandindo notes.
- Somente `super_admin`; leitura via admin client / actions existentes.

**Fora de escopo:** dashboard NPS agregado, export CSV, marcar feedback lido (pode vir depois).

---

## 5. Arquivos principais

| Arquivo | Mudança |
|---------|---------|
| `src/lib/founding/content.ts` | Copy canônico fim beta + frase founding |
| `src/components/layout/beta-banner.tsx` | Copy + link `/feedback` |
| `src/components/layout/app-sidebar.tsx` | Item Enviar feedback (gate) |
| `src/app/(app)/feedback/page.tsx` | Formulário |
| `src/modules/feedback/*` | actions, form, validation, types |
| `supabase/migrations/028_beta_feedback.sql` | Tabela |
| `src/lib/auth/routes.ts` | `/feedback` |
| `src/app/admin/founding/page.tsx` + módulo | Lista feedbacks |
| `src/lib/supabase/types.ts` | Tipagem |
| `docs/superpowers/GUIA-MASTER.md` | Nota no checklist pré-beta |

---

## Critérios de aceite

- [ ] Banner e `/founding` mostram fim em 07/08/2026 + frase founding member
- [ ] Sidebar + banner levam a `/feedback` com gate
- [ ] 6 campos conforme tabela; validação server-side
- [ ] Persistência em `beta_feedback`; toast + reenvio
- [ ] Super admin vê lista em `/admin/founding`
- [ ] `npm run test` + `npm run build` passam

---

## Próximo passo

1. Review deste arquivo pelo usuário  
2. Plano `plans/2026-07-13-beta-feedback.md`  
3. Implementação (TDD em validation + resolve gate)
