# Dental Seven MVP — Design Spec

**Versão:** 1.1  
**Data:** 2026-06-11  
**Autor:** DR7 Performance (brainstorming com cliente)  
**Status:** Aprovada — pronta para plano de implementação

---

## 1. Contexto e objetivo

### Produto

**Dental Seven** — sistema web para clínicas odontológicas pequenas (1–3 dentistas, sem recepção). Desenvolvido por **DR7 Performance** (gestores de IA, sistemas nichados e agentes n8n para atendimento/agendamento).

### Objetivo deste MVP

Portfólio/demo para apresentação a clientes potenciais, com:

- Demo ao vivo em reuniões
- Link público compartilhável pós-reunião (colegas → novos leads)

Princípio **YAGNI**: entregar apenas agenda + pacientes + WhatsApp simulado, com arquitetura pronta para escalar.

### Público-alvo da demo

Donos de clínicas com 1–2 dentistas, sem atendentes — o dentista usa o sistema entre consultas, inclusive no celular.

---

## 2. Decisões de escopo (aprovadas)

| # | Tópico | Decisão |
|---|--------|---------|
| 1 | Apresentação | Demo ao vivo + link público persistente |
| 2 | Acesso demo | Tela `/entrar` com senha única (env `DEMO_PASSWORD`) |
| 3 | WhatsApp | UI simulada — sem API real no MVP |
| 4 | Agenda | Visão semanal + visão “Hoje”; CRUD; vínculo paciente; status |
| 5 | Pacientes | Lista + ficha + anotações + histórico de consultas (read-only) |
| 6 | Marca | **Dental Seven** em destaque; **DR7 Performance** na entrada e rodapé |
| 7 | Identidade visual | `identidade-visual.md` (site DR7) + skill `frontend-design` |
| 8 | Stack | Next.js 15 (App Router) + Supabase + TypeScript + Tailwind |
| 9 | Dentistas na demo | 2 dentistas com seletor de profissional |
| 10 | Responsividade | Completa — agenda e pacientes usáveis no celular |
| 11 | Domínio demo/prod | Subdomínio `dental-seven.dr7performance.com.br` (recomendado) |
| 12 | Integração n8n | Pós-MVP via MCP n8n no Cursor — fluxos criados e testados na instância DR7 |

---

## 3. Abordagem arquitetural

### Escolhida: App único Next.js + Supabase com schema clinic-ready

- Uma clínica fictícia seedada para demo
- Todas as tabelas com `clinic_id` para multi-tenant futuro
- Módulos organizados em pastas extensíveis
- Auth real e SuperAdmin na v2 — não no MVP

### Rejeitadas

| Abordagem | Motivo |
|-----------|--------|
| Dados 100% mock (JSON) | Reescrever tudo ao escalar; demo menos convincente |
| Multi-tenant completo no MVP | Overkill para portfólio; atrasa entrega |

---

## 4. Arquitetura e rotas

```
[Visitante] → /entrar (senha demo) → cookie demo_session
                ↓
         /agenda (default após login)
         ├── /agenda        — semana + hoje, 2 dentistas
         ├── /pacientes     — lista + ficha + anotações
         └── /whatsapp      — conversas simuladas
```

### Middleware

- Rotas do app exigem cookie `demo_session` válido
- Sem cookie → redirect `/entrar`
- `/entrar` com cookie válido → redirect `/agenda`

### Layout

- **Desktop:** sidebar (Agenda, Pacientes, WhatsApp) + header com seletor de dentista
- **Mobile:** bottom nav (3 ícones lucide-react) + header compacto
- Nav extensível para módulos futuros via `clinic_modules` (v2+)

### Fora do escopo MVP

- Login por usuário real (Supabase Auth)
- Multi-clínica na UI
- Integração n8n / WhatsApp Business API
- Prontuário eletrônico completo, upload de documentos
- Faturamento, estoque, fornecedores (desenhados para v3–v5)
- Painel SuperAdmin
- Suite E2E automatizada

---

## 5. Identidade visual e marca

### Referências

- `Site DR7 Performance/dr7performance/docs/identidade-visual.md`
- `Site DR7 Performance/dr7performance/.agents/skills/frontend-design/SKILL.md`

### Direção estética

Tech premium **dark-first**: fundo `#000000`, superfície `#1A1A1B`, acento `#4490E2`, Montserrat (títulos/CTAs) + Inter (corpo).

### Logos DR7

| Arquivo | Uso | Fundo |
|---------|-----|-------|
| `public/brand/dr7-logo-dark-bg.png` | Entrada, rodapé, sidebar | Escuro (`#000`, `#1A1A1B`) — DR/PERFORMANCE brancos, “7” gradiente azul |
| `public/brand/dr7-logo-light-bg.png` | Reserva para superfícies claras | Claro — DR/PERFORMANCE cinza escuro, “7” gradiente azul |

Componente: `<Dr7Logo variant="on-dark" | "on-light" />` — escolhe variante por contraste.

### Dental Seven (produto)

Wordmark tipográfico em Montserrat uppercase com acento `#4490E2` em “Seven” até existir logo própria.

### Tela `/entrar` (premium)

- Fundo `#07090f` + grade tech (`.bg-tech-grid`) + glow radial azul
- Wordmark Dental Seven + logo DR7 menor
- Campo senha + CTA gradiente 135° (padrão DR7)
- Animação fade-in-up na entrada
- Copy: *“Demonstração — explore agenda, pacientes e WhatsApp”*

---

## 6. Modelo de dados (Supabase)

Todas as entidades de negócio incluem `clinic_id UUID NOT NULL`.

### Tabelas MVP

```sql
clinics
  id, name, slug, created_at

dentists
  id, clinic_id, name, color (hex), active, created_at

patients
  id, clinic_id, name, phone, whatsapp, birth_date,
  notes (text), created_at, updated_at

appointments
  id, clinic_id, dentist_id, patient_id,
  starts_at, ends_at, duration_min (default 30),
  status: confirmed | pending | cancelled | completed,
  procedure_label (text — futuro FK para procedures),
  notes (text optional),
  created_at, updated_at

whatsapp_threads
  id, clinic_id, patient_id, last_message_at, created_at

whatsapp_messages
  id, thread_id, direction: inbound | outbound,
  body, sent_at,
  status: sent | delivered | read
```

### Status `completed` na agenda

Incluído no MVP como status disponível (pode não ter UI dedicada ainda). Gatilho futuro para:

- Baixa automática de estoque
- Lançamento financeiro automático

### Seed da demo

| Entidade | Conteúdo |
|----------|----------|
| Clínica | *Clínica Sorriso Norte* (fictícia) |
| Dentistas | Dra. Ana Silva (`#4490E2`), Dr. Carlos Mendes (`#6BA3E8`) |
| Pacientes | ~8 registros fictícios |
| Consultas | ~15 (semana atual ± dias adjacentes) |
| WhatsApp | 3–4 threads com mensagens pré-carregadas |

### RLS (MVP)

Política permissiva para demo (anon key + cookie gate no app). Endurecer na v2 com Supabase Auth + RLS por `clinic_id`.

---

## 7. Módulos funcionais

### 7.1 Agenda (`/agenda`)

- Toggle **Semana** | **Hoje**
- Filtro: Todos / Dra. Ana / Dr. Carlos
- **Semana:** grade 08h–18h, blocos coloridos por dentista
- **Hoje:** lista cronológica (prioridade mobile)
- Modal criar/editar: paciente (select), data/hora, duração, procedimento, status
- Ações: confirmar, cancelar, reagendar

### 7.2 Pacientes (`/pacientes`)

- Lista com busca (nome, telefone)
- Ficha: dados de contato, anotações editáveis, histórico de consultas (read-only)
- Atalho “Nova consulta” → `/agenda` com paciente pré-selecionado

### 7.3 WhatsApp (`/whatsapp`) — simulado

- Inbox: threads (sidebar desktop / lista full mobile)
- Chat: bolhas inbound/outbound, timestamps, status ✓✓
- Botões demo: **Confirmar consulta**, **Reagendar**, **Enviar lembrete** → atualizam UI + toast (sem API)
- Banner: *“Demonstração — em produção integra com n8n + WhatsApp Business”*

---

## 8. Roles, SuperAdmin e módulos futuros

### Roles (v2 — Supabase Auth)

```sql
profiles
  id (references auth.users),
  role: super_admin | clinic_admin | dentist,
  clinic_id (nullable — super_admin não tem),
  dentist_id (nullable),
  created_at
```

| Papel | Acesso |
|-------|--------|
| **super_admin** | DR7 — todas as clínicas, métricas, ligar/desligar módulos, suporte, exportação any clinic |
| **clinic_admin** | Dono — só sua clínica |
| **dentist** | Agenda, pacientes, procedimentos que atende |

Painel `/admin` (v2+): lista clínicas, status, impersonação para suporte.

### Módulos plugáveis (v2+)

```sql
clinic_modules
  clinic_id, module_key, enabled, config (jsonb)
```

```
/modules/agenda        → MVP ✅
/modules/pacientes     → MVP ✅
/modules/whatsapp      → MVP ✅ (simulado)
/modules/procedimentos → v3 — catálogo + BOM (insumos por procedimento)
/modules/estoque       → v4 — quantidades, alertas mínimo, baixa automática
/modules/financeiro    → v5 — receita, custos fixos/variáveis, margem
/modules/fornecedores  → v5 — contatos, vínculo com insumos, acelerar compra
```

### Roadmap

| Versão | Entrega |
|--------|---------|
| **v1 (MVP)** | Agenda + Pacientes + WhatsApp simulado + gate senha |
| **v2** | Auth + roles + exportação + encerramento de conta |
| **v3** | Catálogo de procedimentos + BOM |
| **v4** | Estoque + alertas + baixa automática ao concluir procedimento |
| **v5** | Financeiro + fornecedores |
| **v6** | Painel SuperAdmin DR7 + WhatsApp real via n8n (MCP integrado no projeto) |

### Ideias adicionais (backlog)

- Comissões por dentista
- Relatório “fim do dia”
- Lista de espera para encaixes
- Lembretes automáticos (n8n)

---

## 9. Exportação de dados e encerramento de conta (v2)

Requisito de confiança, portabilidade (LGPD) e offboarding contratual.

### Princípio

Cada clínica é dona dos dados. Exportação e exclusão são **sempre isoladas por `clinic_id`**.

### Permissões

| Papel | Exportação |
|-------|------------|
| clinic_admin | Só a própria clínica |
| super_admin | Qualquer clínica |

### Conteúdo exportado

Todos os dados da clínica na data da exportação:

- Clínica, dentistas, pacientes, consultas, threads/mensagens WhatsApp
- Futuro: procedimentos, estoque, movimentações, financeiro, fornecedores

**Excluído:** senhas, tokens, logs internos DR7, dados de outras clínicas.

### Formato

Arquivo único **ZIP**:

```
dental-seven-export_{slug-clinica}_{AAAA-MM-DD}.zip
```

Conteúdo:

```
README.txt
manifest.json           # versão schema, data UTC, contagens, checksums
clinic.json
dentists.json
patients.json
appointments.json
whatsapp_threads.json
whatsapp_messages.json
patients.csv              # leitura humana (Excel/Sheets)
appointments.csv
dentists.csv
```

| Formato | Propósito |
|---------|-----------|
| JSON | Exportação canônica completa — reimportação, backup técnico |
| CSV | Leitura humana — dono, contador, advogado |
| manifest.json | Prova do escopo exportado |

Encoding UTF-8. Datas ISO 8601. CSV: vírgula, campos com vírgula entre aspas.

### Fluxo de exportação

1. Admin: **Configurações → Exportar todos os dados**
2. Backend: `buildClinicExport(clinicId)` → ZIP (job assíncrono se volume grande)
3. Download via link temporário (24h, uso único, HTTPS)
4. E-mail opcional de notificação

```typescript
// lib/export/build-clinic-export.ts
buildClinicExport(clinicId: string): Promise<Buffer>

POST /api/clinics/[id]/export  → { jobId }
GET  /api/exports/[jobId]      → status | download
```

Módulos futuros registram provider: `registerExportProvider('financeiro', ...)`.

### Fluxo de encerramento

1. Aviso: recomendar exportação prévia
2. Confirmação forte (senha + digitar nome da clínica)
3. Exportação automática final (recomendada)
4. Soft delete (30–90 dias, recuperável por super_admin)
5. Hard delete definitivo após período
6. Registro em `audit_log` (quem, quando, IP)

**MVP:** requisito documentado; implementação na v2.

---

## 10. Deploy, domínio e ambiente

| Camada | Serviço |
|--------|---------|
| Frontend + API | Vercel (projeto separado do site DR7) |
| Banco | Supabase |
| Domínio | **`dental-seven.dr7performance.com.br`** |

### Domínio: subdomínio vs subpath

Domínio oficial DR7: **`dr7performance.com.br`**.

| Opção | URL | Recomendação |
|-------|-----|--------------|
| **Subdomínio** | `dental-seven.dr7performance.com.br` | **Escolhida** |
| Subpath | `dr7performance.com.br/dental-seven` | Alternativa — não usar no MVP |

**Por que subdomínio (recomendado):**

- **Deploy independente** — Dental Seven é Next.js; o site DR7 é outro projeto. Subdomínio aponta para Vercel sem proxy nem `basePath`.
- **Produto com identidade própria** — reforça Dental Seven como produto, com DR7 no rodapé/entrada.
- **Cookies e sessão** — isolados do site institucional; menos conflito com analytics, cache e auth futura.
- **Webhooks n8n** — URL estável e dedicada (`https://dental-seven.dr7performance.com.br/api/...`) para integrações pós-MVP.
- **Escala** — preview deploys, env vars e domínio customizado por clínica no futuro (`app.cliente.com.br`) sem acoplar ao site DR7.

**Subpath** só faria sentido se o app fosse embedado no mesmo build do site — adiciona complexidade (rewrite, `basePath`, assets, rotas) sem benefício no MVP.

### DNS (quando for deployar)

1. Projeto Vercel do Dental Seven → Settings → Domains → `dental-seven.dr7performance.com.br`
2. No registrador do domínio: registro **CNAME** `dental-seven` → `cname.vercel-dns.com` (ou valor indicado pela Vercel)
3. SSL automático via Vercel

Site DR7 pode linkar a demo no portfólio: *“Experimente a demo → dental-seven.dr7performance.com.br”*.

### Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_NAME=Dental Seven

DEMO_PASSWORD=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 11. Integração n8n (pós-MVP)

Fora do escopo v1. Documentado para quando sairmos do MVP e substituirmos o WhatsApp simulado por fluxos reais.

### Abordagem

Integrar o **MCP n8n** neste repositório Cursor para que o agente:

1. Crie e edite workflows na **instância n8n da DR7**
2. Execute testes end-to-end nos fluxos (confirmação, lembrete, reagendamento, inbound)
3. Documente webhooks e credenciais necessários (sem commitar secrets)

### Fluxos previstos (v6)

| Fluxo | Gatilho | Ação |
|-------|---------|------|
| Confirmação de consulta | Webhook Dental Seven ou agenda | Mensagem WhatsApp ao paciente |
| Lembrete 24h | Cron n8n | WhatsApp + atualização status |
| Reagendamento | Webhook ou inbound WhatsApp | Atualiza appointment no Supabase |
| Inbound WhatsApp | WhatsApp Business API → n8n | Parser + resposta ou handoff |

### Contrato app ↔ n8n

```
Dental Seven API  ──webhook──►  n8n workflow
n8n workflow      ──HTTP────►  Dental Seven API (Supabase via route handlers)
```

- Endpoints documentados em `docs/integrations/n8n.md` (criar na v6)
- Autenticação webhook: header `X-Webhook-Secret` (env)
- UI Dental Seven deixa de ser simulada; threads/mensagens refletem estado real (sync ou polling)

### Testes com MCP

- Agente dispara execução de workflow de teste na instância n8n DR7
- Valida resposta e efeito no banco (consulta confirmada, mensagem registrada)
- Smoke checklist estendido na v6 (substitui cenários simulados do MVP)

**MVP:** banner “demonstração” permanece; nenhuma dependência de n8n no build v1.

---

## 12. Estrutura de pastas

```
dental-seven/
├── public/brand/              # logos DR7
├── src/
│   ├── app/
│   │   ├── entrar/
│   │   ├── (app)/agenda|pacientes|whatsapp/
│   │   └── api/auth/demo/
│   ├── components/brand|ui/
│   ├── lib/supabase|demo-session|export/   # export na v2
│   ├── modules/agenda|pacientes|whatsapp/
│   └── styles/tokens.css
├── supabase/migrations/
└── docs/superpowers/specs/
```

---

## 13. Testes (MVP)

Smoke manual:

- [ ] Entrar com senha → acesso ao app
- [ ] CRUD consulta na agenda
- [ ] Ver/editar ficha de paciente
- [ ] Abrir thread WhatsApp simulada + ação demo
- [ ] Agenda “Hoje” e lista pacientes usáveis no celular

Sem E2E automatizado no MVP.

---

## 14. Checklist de qualidade UI

- [ ] Cores via tokens (sem hex soltos)
- [ ] Montserrat títulos/CTAs; Inter corpo
- [ ] Botões primários gradiente 135°
- [ ] Cards `border-border` + `bg-surface` + hover primary
- [ ] Logos com contraste correto (`Dr7Logo` variant)
- [ ] Mobile-first
- [ ] Copy honesta — dados fictícios rotulados como demo

---

*Dental Seven — DR7 Performance. Spec v1.1 — aprovada 2026-06-11 (addendum: domínio + n8n MCP).*
