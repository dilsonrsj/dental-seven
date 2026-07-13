# Dental Seven MVP — Design Spec

> **Roadmap consolidado e status:** `docs/superpowers/GUIA-MASTER.md` §3. Este documento é referência histórica da v1 e visão inicial.

**Versão:** 1.4  
**Data:** 2026-06-15  
**Autor:** DR7 Performance (brainstorming com cliente)  
**Status:** v1 implementada localmente — deploy adiado; evolução documentada em specs v2 e estratégia comercial

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
- **v2.5+:** aba **Prontuário** na ficha — upload, documentos e (v3.5) viewer inline + documentos clínicos assinados (ver §8 backlog v2.5 / v3.5)

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
/modules/prontuario    → v2.5–v3.5 — upload, viewer, documentos clínicos assinados
/modules/procedimentos → v3 — catálogo + BOM (insumos por procedimento)
/modules/estoque       → v4 — quantidades, alertas mínimo, baixa automática
/modules/financeiro    → v5 — receita, custos fixos/variáveis, margem
/modules/fornecedores  → v5 — contatos, vínculo com insumos, acelerar compra
```

### Roadmap

| Versão | Entrega |
|--------|---------|
| **v1 (MVP)** | Agenda + Pacientes + WhatsApp simulado + gate senha |
| **v2** | Auth + roles + **cadastro de pacientes** + **planos/módulos** + **trial 7d + Asaas** + **paywall** + exportação + encerramento — ver `2026-06-15-v2-design.md` |
| **v2.5** | **Prontuário (fase 1)** — upload de histórico externo + Supabase Storage + listagem na ficha |
| **v3** | Catálogo de procedimentos + BOM |
| **v3.5** | **Prontuário (fase 2)** — viewer inline (PDF/imagens), registros clínicos, receita/atestado/guia com assinatura + PDF/impressão |
| **v4** | Estoque + alertas + baixa automática ao concluir procedimento |
| **v5** | Financeiro + fornecedores |
| **v6** | Painel SuperAdmin DR7 + WhatsApp real via n8n (MCP integrado no projeto) |
| **v6.1** | **Agente IA + KB vetorizado** — OpenAI `gpt-4o-mini` + pgvector; workflow n8n parametrizado por clínica (plano **Inteligente**) |

### Ideias adicionais (backlog)

- Comissões por dentista
- Relatório “fim do dia”
- Lista de espera para encaixes
- Lembretes automáticos (n8n)

### Backlog v2 — funcionalidades

#### Novo Paciente (cadastro)

**Problema no MVP:** o modal “Nova consulta” só permite selecionar pacientes do seed demo; não há fluxo de cadastro.

**Escopo v2:**

| Item | Detalhe |
|------|---------|
| **Onde** | Botão “Novo paciente” em `/pacientes`; atalho “+ Cadastrar paciente” no select do modal “Nova consulta” |
| **Campos** | Nome (obrigatório), telefone, WhatsApp, data de nascimento (opcional), anotações iniciais (opcional) |
| **Ação** | `createPatient` server action → insert em `patients` com `clinic_id` da sessão |
| **Pós-salvar** | Redirecionar para ficha do paciente ou `/agenda?patientId=` para agendar na hora |
| **Permissões** | `clinic_admin` e `dentist` (após auth v2); MVP demo continua sem cadastro |
| **Validação** | Nome mínimo 2 caracteres; telefone/WhatsApp normalizados (E.164 ou DDD+ número BR) |
| **Testes** | Vitest para `createPatient`; smoke: cadastrar → aparecer na lista → usar em nova consulta |

**Fora do escopo v2:** importação em massa (CSV), duplicidade inteligente, merge de fichas.

### Backlog v2.5 — Módulo Prontuário (fase 1: upload e armazenamento)

**Problema no MVP:** a ficha do paciente tem apenas observações em texto e histórico de consultas (read-only). Não há prontuário eletrônico nem upload de documentos vindos de outros sistemas.

**Escopo v2.5:**

| Item | Detalhe |
|------|---------|
| **Onde** | Aba ou rota `/pacientes/[id]/prontuario` na ficha do paciente |
| **Upload** | Drag-and-drop ou seletor de arquivo — PDF, JPG, PNG (outros formatos em fases posteriores) |
| **Origem** | Histórico importado de outra plataforma/sistema; laudos; resultados de exame |
| **Storage** | Supabase Storage — bucket por `clinic_id`, path `{clinic_id}/{patient_id}/{document_id}` |
| **Banco** | Tabela `patient_documents` (`clinic_id`, `patient_id`, `title`, `mime_type`, `storage_path`, `source`: `imported` \| `generated` \| `clinical`, `uploaded_by`, `created_at`) |
| **UI** | Lista de documentos na aba Prontuário; metadados (nome, data, tipo) |
| **Permissões** | `clinic_admin` e `dentist` (após auth v2); auditoria de quem fez upload |
| **Pré-requisitos** | v2 (auth + cadastro de pacientes) |

**Fora do escopo v2.5:** viewer inline, geração de documentos, DICOM nativo.

### Backlog v3.5 — Módulo Prontuário (fase 2: visualização e documentos clínicos)

**Problema:** documentos armazenados na v2.5 ainda não abrem na tela do app; não há criação de receitas, atestados ou guias de exame com assinatura profissional.

**Escopo v3.5:**

| Item | Detalhe |
|------|---------|
| **Viewer inline** | PDF e imagens abrem na própria tela do prontuário (sem download obrigatório); lightbox/zoom para imagens |
| **Registros clínicos** | Evolução por consulta (texto estruturado, opcionalmente ligado a `appointments`) — além do histórico read-only já existente |
| **Dentistas** | Estender `dentists`: `cro`, `specialty`, `signature_storage_path` (imagem da assinatura) |
| **Templates** | Receita, atestado, guia de exame e outros documentos clínicos |
| **Geração PDF** | Documento gerado com assinatura, especialidade e CRO do dentista logado |
| **Impressão** | Download PDF + `window.print()` para impressora local ou em rede |
| **Envio ao paciente (simulado)** | Botão na ficha → anexa na thread WhatsApp demo + toast (até v6 real) |
| **Envio ao paciente (produção)** | v6 — disparo via n8n + Meta Cloud API com PDF anexo |
| **Assinatura digital ICP-Brasil** | Fora do escopo v3.5 — assinatura visual (imagem + dados profissionais) é suficiente na demo e v1 do módulo |

**Formatos de imagem (v3.5):** JPG, PNG, PDF exportado de equipamentos (RX, panorâmica, fotos intraorais). **DICOM** (tomografia 3D) fica para fase posterior — na v3.5 aceitar exportações JPG/PDF do equipamento.

**Dependências:** v2.5 (upload + storage); v6 para envio real de PDFs via WhatsApp.

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
- Futuro: documentos de prontuário (metadados + arquivos no Storage), procedimentos, estoque, movimentações, financeiro, fornecedores, KB (v6.1)

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

### Conexão WhatsApp — modelo oficial (v6)

**Abordagem escolhida:** [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp) (Cloud API da Meta), **não** conexão por QR code tipo WhatsApp Web.

| Abordagem | Como funciona | Dental Seven |
|-----------|---------------|--------------|
| **API oficial (Cloud API)** | Número verificado na Meta; mensagens via HTTPS + webhooks | **Escolhida (v6)** |
| **QR code (WhatsApp Web / APIs não oficiais)** | Escaneia QR no celular; sessão instável; viola ToS Meta para automação | **Não usar** |

**Por que não QR code:** sessões caem com frequência, risco de banimento, sem templates aprovados, inadequado para CRM clínico em produção. A DR7 orquestra via **n8n** + API oficial para confiabilidade e conformidade.

#### Passo a passo da conexão (clínica + DR7)

**Fase A — Conta Meta (uma vez por clínica ou centralizado pela DR7 como BSP)**

1. Criar ou usar **Meta Business Portfolio** da clínica (ou da DR7 como parceiro).
2. Criar **WhatsApp Business Account (WABA)** vinculada ao portfólio.
3. Adicionar **número de telefone** da clínica (linha dedicada recomendada; pode ser fixo com SMS ou celular).
4. **Verificar o número** via SMS ou ligação (código Meta) — *não é QR code*.
5. No [Meta for Developers](https://developers.facebook.com/): criar app → adicionar produto WhatsApp → gerar **token de acesso** (System User ou Embedded Signup).
6. Configurar **webhook** na Meta apontando para n8n (URL pública, ex.: `https://n8n.dr7performance.com.br/webhook/whatsapp-inbound`).
7. Assinar eventos: `messages`, `message_status` (entregue/lida).

**Fase B — n8n (instância DR7)**

8. Credenciais WhatsApp Cloud API no n8n (Phone Number ID, WABA ID, token).
9. Workflow **inbound:** webhook Meta → parse mensagem → HTTP POST Dental Seven (`/api/whatsapp/inbound`) → grava `whatsapp_messages` + atualiza thread.
10. Workflow **outbound:** webhook Dental Seven ou trigger agenda → template ou mensagem dentro da janela 24h → Cloud API send.
11. Workflows automáticos: confirmação, lembrete 24h, reagendamento (spec §11 fluxos previstos).

**Fase C — Dental Seven (app)**

12. Remover banner “simulado”; inbox lê threads/mensagens reais do Supabase.
13. Botões “Confirmar / Reagendar / Lembrete” disparam webhook para n8n (não simulam bolha local).
14. Resposta manual do dentista/recepção (v6+): composer na UI → API route → n8n → Cloud API.
15. `clinic_modules.whatsapp.config` guarda `phone_number_id`, status conexão, último sync (sem token no front).

**Fase D — Go-live**

16. Aprovar **message templates** na Meta (confirmação, lembrete, reagendamento — obrigatório fora da janela 24h).
17. Smoke E2E: enviar mensagem teste → aparece no inbox → responder → paciente recebe no WhatsApp.
18. Monitorar quality rating e limites de tier na Meta.

#### Diagrama

```
Paciente (WhatsApp app)
        ↕ HTTPS (Cloud API)
Meta WhatsApp Platform
        ↕ webhook + send API
n8n (DR7) — automações, templates, cron
        ↕ webhooks + route handlers
Dental Seven (Next.js + Supabase) — inbox CRM, agenda, pacientes
```

**Onboarding na UI (v6):** wizard em Configurações → “Conectar WhatsApp” guia a clínica pelos passos A.1–A.4 (verificação de número); passos técnicos A.5–B restam com suporte DR7 ou self-service avançado.

---

## 11.1 Agente IA + KB vetorizado (v6.1) — diferencial estratégico

**Status:** aprovado no roadmap — documentado em 2026-06-12 após alinhamento com cliente.

**Posicionamento:** camada **pós-v6** que transforma o WhatsApp real em atendimento inteligente. O agente IA no **n8n (DR7)** atende pacientes, agenda consultas/procedimentos, responde FAQ e faz handoff para operador humano quando necessário. É o **grande diferencial** do Dental Seven frente a CRMs genéricos.

**Pré-requisitos:** v6 (WhatsApp real, APIs inbound/outbound, auth + RLS). O MVP prepara o terreno (tabelas `whatsapp_*`, `patients`, `appointments`) mas **não** expõe ainda endpoints para o agente.

### O que já existe (fundação)

| Peça | Status |
|------|--------|
| Tabelas `whatsapp_threads` + `whatsapp_messages` | Prontas |
| Tabelas `patients`, `appointments`, `dentists` | Prontas |
| UI inbox (leitura de threads/mensagens) | Pronta (demo) |
| `clinic_id` em tudo | Pronta para multi-clínica |

### O que falta (v6 + v6.1)

| Peça | Versão | Para quê |
|------|--------|----------|
| `/api/whatsapp/inbound` | v6 | Meta → n8n → Dental Seven grava mensagem inbound |
| `/api/whatsapp/outbound` | v6 | Operador ou agente envia resposta → n8n → Meta |
| Webhook auth (`X-Webhook-Secret`) | v6 | Segurança n8n ↔ app |
| Realtime ou polling na UI | v6 | Inbox atualizar sem F5 |
| Composer na UI | v6 | Operador humano responder manualmente |
| `sender: bot \| human \| patient` em mensagens | v6.1 | Saber quem respondeu; handoff bot → humano |
| **API de ferramentas do agente** | v6.1 | Agendar, listar horários, buscar paciente |
| Tabela **KB + pgvector** no Supabase | v6.1 | FAQ vetorizado por clínica |
| `/api/kb/search` ou RPC `match_kb` | v6.1 | Agente consultar KB |
| Idempotência (`meta_message_id`) | v6 | Evitar duplicar mensagens |

### Princípio arquitetural

O **Supabase é a fonte da verdade**. O Dental Seven **não puxa mensagens do n8n** — lê do Supabase (`whatsapp_messages`). O n8n **orquestra** WhatsApp + IA; o app **persiste e exibe**.

```
                    ┌─────────────────────────────────────┐
                    │           Meta Cloud API            │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │              n8n (DR7)              │
                    │  ┌─────────────────────────────┐   │
                    │  │ Agente IA (LLM + tools)      │   │
                    │  │ • FAQ → KB vetor (Supabase)  │   │
                    │  │ • Agendar → API Dental Seven │   │
                    │  │ • Handoff → operador humano  │   │
                    │  └─────────────────────────────┘   │
                    └───────┬──────────────────▲─────────┘
                            │ HTTP              │ HTTP
              inbound       │                   │ outbound
                            ▼                   │
                    ┌─────────────────────────────────────┐
                    │     Dental Seven (Next.js API)      │
                    │  /api/whatsapp/inbound|outbound     │
                    │  /api/appointments/* (tools agente) │
                    │  /api/kb/search                     │
                    └──────────────┬──────────────────────┘
                                   │ Supabase JS (server)
                                   ▼
                    ┌─────────────────────────────────────┐
                    │            Supabase                 │
                    │  whatsapp_messages, appointments    │
                    │  kb_documents + embeddings (pgvector) │
                    └──────────────┬──────────────────────┘
                                   │ read / Realtime
                                   ▼
                    ┌─────────────────────────────────────┐
                    │   Dental Seven UI (/whatsapp)       │
                    └─────────────────────────────────────┘
```

### Fluxo inbound (paciente → inbox + agente)

1. Paciente manda WhatsApp → **Meta** recebe.
2. Meta dispara webhook → **n8n**.
3. n8n chama `POST /api/whatsapp/inbound` com `clinic_id`, `patient_phone`, `body`, `meta_message_id`.
4. Dental Seven resolve/cria `patient` + `whatsapp_thread`, insere `whatsapp_messages` (`direction: inbound`).
5. UI atualiza via Supabase Realtime ou polling.
6. **Paralelo no n8n:** agente IA processa a mensagem e decide resposta ou handoff.

### Fluxo outbound do agente IA

1. Agente no n8n gera resposta (FAQ do KB ou confirma agendamento).
2. Se agendar: chama tool `POST /api/appointments` (horários, dentista, paciente).
3. n8n chama `POST /api/whatsapp/outbound`; Dental Seven grava (`direction: outbound`, `sender: bot`).
4. n8n envia via Meta Cloud API; status `delivered/read` retorna por webhook.

### KB vetorizado (Supabase)

```sql
-- conceitual (v6.1)
kb_documents (id, clinic_id, title, content, ...)
kb_embeddings  (document_id, embedding vector(1536), ...)
-- extensão pgvector + RPC match_kb(clinic_id, query_embedding, limit)
```

**Fluxo FAQ:** paciente pergunta → n8n embedda → consulta Supabase (RPC ou `POST /api/kb/search`) → agente monta resposta com chunks retornados. O KB **não precisa passar pela UI** — só a conversa resultante aparece no inbox.

### Tools do agente (APIs a expor na v6.1)

| Tool | Endpoint (exemplo) |
|------|-------------------|
| Horários livres | `GET /api/agenda/slots?dentist=&date=` |
| Criar consulta | `POST /api/appointments` |
| Confirmar/cancelar | `PATCH /api/appointments/:id` |
| Buscar paciente por telefone | `GET /api/patients?whatsapp=` |
| Buscar FAQ | `POST /api/kb/search` |

Autenticação: service token; Dental Seven valida regras de negócio e grava nas mesmas tabelas que a UI usa.

### Opções de priorização (decisão de produto)

| Opção | Descrição |
|-------|-----------|
| **A (recomendada)** | v6 = WhatsApp real + APIs; v6.1 = agente + KB |
| **B** | Plano único “v6-agent-whatsapp” entregando inbox real + agente + FAQ junto |
| **C** | Protótipo do agente no n8n antes da UI final (n8n + Supabase direto), depois integrar ao Dental Seven |

### Integração com Prontuário (v3.5)

Na v6, envio real de PDFs (receita, atestado, guia) gerados no prontuário segue o fluxo outbound acima — anexo via n8n → Meta Cloud API.

**Documentação adicional (criar na v6.1):** `docs/integrations/n8n-agent.md`

---

## 12. Estrutura de pastas

```
dental-seven/
├── public/brand/              # logos DR7
├── src/
│   ├── app/
│   │   ├── entrar/
│   │   ├── (app)/agenda|pacientes|whatsapp/
│   │   │   └── pacientes/[id]/prontuario/   # v2.5+
│   │   └── api/auth/demo/                   # v6+: api/whatsapp, api/kb, api/appointments
│   ├── components/brand|ui/
│   ├── lib/supabase|demo-session|export/   # export na v2
│   ├── modules/agenda|pacientes|whatsapp|prontuario/   # prontuário v2.5+
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

## 15. Modelo comercial e planos (addendum 2026-06-15)

Preços finais e regras em `docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md` §3.3.

| Plano | `plan_key` | Mensal | Módulos principais |
|-------|------------|--------|-------------------|
| **Essencial** | `essencial` | **R$ 99,00** | Agenda + Pacientes (1 dentista) |
| **Conecta** | `conecta` | **R$ 149,00** | + WhatsApp |
| **Inteligente** | `inteligente` | **R$ 279,00** | + Agente IA + KB |
| **Completo** | `completo` | **R$ 349,00** | Todos os módulos + 5 GB storage |

**Regras:** Essencial 1 dentista · Conecta+ até 3 · +R$ 20/dentista extra · trial 7d sem cartão · sem implantação · Meta não mencionada na vitrine. Detalhes: spec estratégia §3.4.

- **Um app, um deploy** — planos ligam módulos via `clinic_modules`
- **Trial expirado:** login permitido; app bloqueado com paywall + e-mail automático
- **Deploy v1 demo:** adiado — próximo marco é v2

---

*Dental Seven — DR7 Performance. Spec v1.4 — 2026-06-15.*
