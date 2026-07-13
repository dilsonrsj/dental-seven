# Dental Seven — Decisões estratégicas (modularidade, billing, IA)

> **Guia de execução:** `docs/superpowers/GUIA-MASTER.md`. Matriz planos vigente: guia §6.

> **Atualização 2026-07-07:** A matriz plano × módulo em §7.3 foi **superseded** por `docs/superpowers/specs/2026-07-07-plan-reposition-design.md` (WhatsApp/IA só Completo). Preços §3.4 permanecem válidos. Roadmap §5 superseded pelo guia master §3.

**Versão:** 1.6  
**Data:** 2026-06-15  
**Status:** Aprovada — preços oficiais §3.4 (validação final cliente)  
**Spec base:** `2026-06-11-dental-seven-mvp-design.md`  
**Spec v2:** `2026-06-15-v2-design.md`

---

## 1. Resumo executivo

Decisões comerciais e técnicas do Dental Seven validadas em 2026-06-15. O produto é **um app, um deploy**, com planos que ligam/desligam módulos via `clinic_modules`. Trial de 7 dias sem cartão; cobrança Asaas no 8º dia. Agente IA (v6.1) usa OpenAI `gpt-4o-mini` + pgvector. Deploy da v1 demo **adiado** — desenvolvimento segue para **v2**.

---

## 2. Decisões aprovadas

| # | Tópico | Decisão |
|---|--------|---------|
| 1 | Modularidade | Módulos plugáveis para precificação — ver §2.1 |
| 2 | IA vs. sem IA | Mesmo app; diferenciação por plano/módulo `ai_agent` |
| 3 | Deploys | **Nunca** dois deploys ou dois apps |
| 4 | Trial | 7 dias grátis, **sem cartão** no cadastro |
| 5 | Cobrança | **Somente no 8º dia** via Asaas |
| 6 | Trial expirado | Login funciona; app bloqueado + notificação na tela + e-mail automático |
| 7 | IA por clínica | Workflow n8n **parametrizado** (não um fluxo por clínica) |
| 8 | LLM | OpenAI `gpt-4o-mini` no n8n |
| 9 | Embeddings | pgvector no Supabase |
| 10 | n8n MCP | Workflows construídos via MCP quando chegar v6.1 |
| 11 | Deploy v1 | **Adiado** — avançar para v2 em dev local |
| 12 | Dentistas por plano | **Essencial: 1** · **Conecta+:** até **3** · extra **+R$ 20/mês** (4º+) |
| 13 | WhatsApp / IA (vitrine) | **Inclusos para uso clínico típico** — sem menção a Meta ou limites na comunicação comercial |
| 14 | Storage prontuário | **5 GB/clínica** (Completo); excedente R$ 5/GB |
| 15 | Custos Meta (operacional) | **Absorvidos pela DR7** até fair use interno; **zero** na comunicação comercial |
| 16 | Implantação | **Não existe** no Dental Seven — apenas trial 7d + mensalidade |

---

## 3. Planos comerciais — pesquisa de mercado e recomendação

### 3.1 Concorrentes analisados (2025–2026)

| Plataforma | Nomes de planos | Faixa entrada (mensal) | Trial |
|------------|-----------------|------------------------|-------|
| [Codental](https://www.codental.com.br/preco) | Essencial, Controle, Avançado | R$ 89,90 – R$ 179,90 | 7 dias, sem cartão |
| [Densist](https://densist.com.br/precos) | Grátis, Essencial, Profissional | R$ 0 – R$ 77 (promo) | 14 dias, sem cartão |
| [NetDente](https://netdente.com.br/planos/) | Essencial, Profissional, Empresarial | R$ 99,90 – R$ 349,90 | — |
| [Simples Dental](https://www.simplesdental.com/planos-e-precos) | Basic, Plus, Pro | ~R$ 137 – R$ 321 (anual) | Teste grátis |
| [Clinicorp](https://www.clinicorp.com/planos) | Standard, Premium, Enterprise | ~R$ 127 – R$ 370 | Demo guiada (sem self-service) |
| [Odontiva](https://odontiva.com.br/precos) | Por consultório + usuário | A partir de R$ 60 | 7 dias, sem cartão |
| [Serodonto](https://serodonto.com.br/produtos/planos/serodonto/) | One, Small, Professional, Enterprise | R$ 149 – R$ 479 | Sem trial (demo comercial) |

**Padrões de nomenclatura no mercado:**

- **Entrada:** Essencial, Basic, Starter — universalmente reconhecido
- **Intermediário:** Profissional, Plus, Controle, Avançado
- **Premium:** Premium, Pro, Empresarial
- **WhatsApp/automação:** frequentemente em plano superior ou add-on pago
- **IA:** Densist coloca IA (radiografia) no plano Profissional; poucos usam "IA" no nome — oportunidade de diferenciação DR7

**Faixa típica consultório pequeno (1–3 dentistas):** R$ 60 – R$ 180/mês.

### 3.2 Nomes dos planos — **aprovados** (2026-06-15)

| Plano | `plan_key` | Status |
|-------|------------|--------|
| **Essencial** | `essencial` | ✅ Aprovado |
| **Conecta** | `conecta` | ✅ Aprovado |
| **Inteligente** | `inteligente` | ✅ Aprovado |
| **Completo** | `completo` | ✅ Aprovado |

Descritivo comercial detalhado por módulo e plano: §7 deste documento.

### 3.3 Preços v1 comercial — fechados (2026-06-15)

> **Supersedido por §3.4** após análise de unit economics OS/DR7. Mantido como histórico.

| Plano | Mensal |
|-------|--------|
| Essencial | R$ 89,00 |
| Conecta | R$ 149,00 |
| Inteligente | R$ 249,00 |
| Completo | R$ 299,00 |

Problemas identificados na revisão OS: Essencial subprecificado; Completo com degrau fraco (+R$ 50); “ilimitados” sem fair use; falta implantação e regra Meta.

---

### 3.4 Preços oficiais — **aprovados** (2026-06-15)

#### Tabela oficial

| Plano | `plan_key` | Mensal | Anual (10% off) | Equiv./mês |
|-------|------------|--------|-----------------|------------|
| **Essencial** | `essencial` | **R$ 99,00** | R$ 1.069,20/ano | R$ 89,10 |
| **Conecta** | `conecta` | **R$ 149,00** | R$ 1.609,20/ano | R$ 134,10 |
| **Inteligente** | `inteligente` | **R$ 279,00** | R$ 3.013,20/ano | R$ 251,10 |
| **Completo** | `completo` | **R$ 349,00** | R$ 3.769,20/ano | R$ 314,10 |

> **Completo — preço de lançamento:** R$ 349. Revisão para **R$ 399** quando módulos v3–v5 (prontuário avançado, estoque, financeiro) estiverem entregues e justificarem o tier.

#### Modelo de entrada (sem implantação)

Dental Seven **não cobra taxa de implantação**. Entrada: **trial 7 dias** (sem cartão) → **mensalidade** a partir do 8º dia (Asaas). Onboarding 100% self-service (cadastro, vídeos, base de conhecimento).

#### Regras comerciais (vitrine — o que o cliente vê)

| Regra | Valor |
|-------|-------|
| Trial | 7 dias grátis, sem cartão |
| Cobrança | A partir do 8º dia (Asaas) |
| Implantação | **Não há** — só trial + mensalidade |
| Dentistas inclusos | **Essencial: 1** · **Conecta+:** até **3** |
| Dentista extra (acima do limite) | **+ R$ 20/mês** |
| WhatsApp (Conecta+) | **Incluso** — uso clínico típico |
| IA (Inteligente+) | **Inclusa** — uso clínico típico |
| Meta / API WhatsApp | **Não mencionar** na comunicação comercial |
| Storage prontuário (Completo) | 5 GB/clínica · excedente +R$ 5/GB/mês |
| Suporte | Ver matriz §3.4.1 |
| Fidelidade | Nenhuma |
| Anual | 10% off |

#### 3.4.1 Matriz feature × plano × suporte

| Recurso | Essencial | Conecta | Inteligente | Completo |
|---------|:---------:|:-------:|:-----------:|:--------:|
| Agenda + pacientes | ✅ | ✅ | ✅ | ✅ |
| Dentistas inclusos | **1** | **3** | **3** | **3** |
| Pacientes ativos (cap) | **200** | **500** | **500** | **Ilimitado*** |
| WhatsApp inbox | — | ✅ | ✅ | ✅ |
| Agente IA + KB | — | — | ✅ | ✅ |
| Prontuário + módulos v3–v5 | — | — | — | ✅ |
| Storage | — | — | — | 5 GB |
| Suporte | Base de conhecimento + e-mail 48h | E-mail 24h | E-mail 24h + chat assíncrono | Prioridade 12h |

\*Fair use de plataforma; abuso sujeito a revisão contratual.

#### 3.4.2 Fair use interno (DR7 — não exibir na vitrine; enforcement v6+)

Custos Meta e tokens OpenAI **absorvidos pela DR7** dentro destes tetos. Acima: notificar clínica, throttle ou oferta de upgrade.

| Plano | Cap conversas WhatsApp/mês | Cap respostas IA/mês | Ação ao exceder |
|-------|---------------------------|----------------------|-----------------|
| Conecta | **1.200** | — | Notificar admin; sugerir Inteligente |
| Inteligente | **1.200** | **1.500** | Throttle IA; e-mail DR7 + clínica |
| Completo | **2.500** | **3.500** | Idem + revisão de uso |

> Conecta com 3 dentistas: ~1.200 conv./mês ≈ 20/dia útil — calibrado para clínica pequena ativa.

#### 3.4.3 Unit economics (referência interna — fixos R$ 775 pós-Pro)

| Plano | Preço | Variável est. | Margem contrib. | Clínicas p/ cobrir fixos |
|-------|-------|---------------|-----------------|--------------------------|
| Essencial | R$ 99 | R$ 20 | ~R$ 79 | ~10 |
| Conecta | R$ 149 | R$ 60 | ~R$ 89 | ~9 |
| Inteligente | R$ 279 | R$ 90† | ~R$ 189 | ~5 |
| Completo | R$ 349 | R$ 100 | ~R$ 249 | ~4 |

†Meta + OpenAI dentro do fair use; tenant outlier pode elevar variável.

**Mix alvo DR7:** ticket médio **R$ 190–230** — maioria Conecta/Inteligente; Essencial como porta de entrada.

#### 3.4.4 Posicionamento vs Otília (serviço gerenciado)

| | Dental Seven SaaS | Otília / DR7 gerenciado |
|--|-------------------|-------------------------|
| Preço | R$ 149–349/mês (trial + mensalidade) | ~R$ 1.000/mês + implantação |
| Modelo | Self-service, escala | Alto toque, custom |
| Meta na vitrine | Não mencionar; absorvido até fair use | Transparente no contrato gerenciado |

#### Exemplos de fatura

| Cenário | Total/mês |
|---------|-----------|
| Essencial, 1 dentista | **R$ 99** |
| Conecta, 3 dentistas | **R$ 149** |
| Inteligente, 4 dentistas | **R$ 299** (279 + 20) |
| Completo, 5 dentistas, 6 GB | **R$ 394** (349 + 40 + 5) |

---

## 4. Modelo técnico (resumo)

### 4.1 Modularidade

| Camada | Implementação |
|--------|---------------|
| Código | `src/modules/<nome>/` |
| Banco | `clinic_modules (clinic_id, module_key, enabled, config jsonb)` |
| UI | Nav e rotas condicionais |
| Comercial | `plan_key` → conjunto default de módulos |

### 4.2 IA vs. sem IA

- Plano **Conecta:** WhatsApp manual/templates
- Plano **Inteligente:** webhook n8n → agente OpenAI + RAG pgvector
- Handoff humano: dentista assume conversa no inbox

### 4.3 Billing Asaas

```sql
clinics (
  subscription_status: trialing | active | past_due | expired | canceled,
  trial_ends_at timestamptz,
  plan_key text,
  asaas_customer_id text,
  asaas_subscription_id text
)
```

**Trial expirado:** login OK → `PaywallOverlay` bloqueia funcionalidades → CTA assinar → e-mail automático.

### 4.4 Agente IA (v6.1)

```
WhatsApp → n8n (1 workflow master, clinic_id)
  → config Supabase (horários, dentistas, tom de voz)
  → RAG pgvector (KB da clínica)
  → OpenAI gpt-4o-mini
  → tools: agenda API
```

Construção dos workflows: via **MCP n8n** no Cursor quando chegar v6.1.

---

## 5. Impacto no roadmap

| Versão | Entrega | Status |
|--------|---------|--------|
| **v1** | MVP demo local | ✅ Concluída (deploy adiado) |
| **v2** | Auth, billing, módulos, paywall, LGPD | **→ Próximo** |
| **v2.5–v5** | Prontuário, procedimentos, estoque, financeiro | Planejado |
| **v6** | WhatsApp real (plano Conecta+) | Planejado |
| **v6.1** | Agente IA (plano Inteligente+) | Planejado |

---

## 7. Descritivo comercial — módulos e planos (precificação)

Referência comercial por módulo e plano. **Preços oficiais: §3.4.**

### 7.1 Módulos individuais

#### `agenda` — Agenda odontológica
**Versão:** v1 ✅

| Funcionalidade | Detalhe |
|----------------|---------|
| Visão semanal | Grade 08h–18h, blocos por dentista/cor |
| Visão "Hoje" | Lista cronológica — prioridade mobile |
| CRUD consultas | Criar, editar, confirmar, cancelar, reagendar |
| Multi-dentista | Filtro por profissional (até 3 no público-alvo) |
| Status | Confirmada, pendente, cancelada, concluída |
| Vínculo paciente | Consulta sempre ligada a um paciente |
| Mobile | Bottom nav + visão Hoje otimizada |

**Valor para o cliente:** substitui caderno/planilha; dentista agenda entre consultas no celular.  
**Custo DR7:** baixo (Postgres + compute Next.js).

---

#### `pacientes` — Cadastro e ficha
**Versão:** v1 ✅ (listagem/ficha) · v2 (cadastro novo paciente)

| Funcionalidade | Detalhe |
|----------------|---------|
| Lista com busca | Nome, telefone |
| Ficha do paciente | Contato, anotações editáveis |
| Histórico consultas | Read-only — procedimento, status, dentista, data |
| Novo paciente | v2 — cadastro completo na clínica |
| Atalho agendar | Da ficha → agenda com paciente pré-selecionado |

**Valor:** CRM mínimo da clínica; base para prontuário e WhatsApp.  
**Custo DR7:** baixo.

---

#### `whatsapp` — Inbox WhatsApp
**Versão:** v1 simulado ✅ · v6 real (Meta Cloud API + n8n)

| Funcionalidade | Detalhe |
|----------------|---------|
| Inbox unificado | Threads por paciente; desktop + mobile |
| Chat | Bolhas, timestamps, status entrega/leitura |
| Resposta manual | Dentista/atendente responde pelo app |
| Templates rápidos | Confirmar, reagendar, lembrete (v6) |
| Integração real | v6 — n8n + WhatsApp Business API |
| Histórico | Mensagens persistidas por clínica |

**Valor:** centraliza atendimento; elimina WhatsApp pessoal do dentista.  
**Custo DR7:** **médio-alto** — Meta cobra por conversa (~R$ 0,05–0,30/conversa template no BR); n8n hosting; número Business.

> No plano **Conecta+**, custos Meta e n8n entram na margem DR7 até fair use (§3.4.2). **Não mencionar Meta** na comunicação comercial.

---

#### `ai_agent` — Agente IA de atendimento e agendamento
**Versão:** v6.1

| Funcionalidade | Detalhe |
|----------------|---------|
| Atendimento 24h | Responde dúvidas via WhatsApp automaticamente |
| Agendamento | Consulta disponibilidade e cria/reagenda consultas |
| FAQ personalizado | KB por clínica (horários, procedimentos, valores orientativos) |
| Tom de voz | Configurável por clínica |
| Handoff humano | Dentista assume conversa quando quiser |
| LLM | OpenAI `gpt-4o-mini` via n8n |
| RAG | Embeddings pgvector no Supabase |

**Valor:** **diferencial DR7** — substitui recepção; clínica sem atendente ganha "secretária virtual".  
**Custo DR7:** **alto** — tokens OpenAI por conversa + embeddings + n8n + volume WhatsApp. Principal driver de margem do plano **Inteligente**.

---

#### `prontuario` — Prontuário eletrônico
**Versão:** v2.5 (upload) · v3.5 (viewer + documentos clínicos)

| Funcionalidade | Detalhe |
|----------------|---------|
| Upload documentos | PDF, JPG, PNG — histórico de outros sistemas |
| Storage | Supabase Storage por clínica |
| Viewer inline | v3.5 — abrir PDF/imagem no app |
| Registros clínicos | v3.5 — evolução por consulta |
| Receita / atestado / guia | v3.5 — templates + assinatura + PDF/impressão |
| Envio ao paciente | Simulado até v6; real via WhatsApp v6 |

**Valor:** conformidade + continuidade clínica; substitui pasta física.  
**Custo DR7:** **médio** — Storage Supabase (~GB/mês por clínica).

---

#### `procedimentos` — Catálogo + BOM
**Versão:** v3

| Funcionalidade | Detalhe |
|----------------|---------|
| Catálogo | Procedimentos da clínica com preço base |
| BOM | Insumos necessários por procedimento |
| Vínculo agenda | Procedimento selecionado na consulta |
| Base estoque | Gatilho para baixa automática (v4) |

**Valor:** padroniza orçamentos e operação; base para margem e estoque.  
**Custo DR7:** baixo.

---

#### `estoque` — Controle de insumos
**Versão:** v4

| Funcionalidade | Detalhe |
|----------------|---------|
| Quantidades | Entrada/saída manual |
| Alertas mínimo | Notificação quando abaixo do limite |
| Baixa automática | Ao concluir procedimento (via BOM v3) |
| Vínculo fornecedor | Acelerar reposição (v5) |

**Valor:** evita falta de material em procedimento; controle de custo.  
**Custo DR7:** baixo.

---

#### `financeiro` — Gestão financeira
**Versão:** v5

| Funcionalidade | Detalhe |
|----------------|---------|
| Receita | Lançamentos por consulta/procedimento |
| Custos fixos/variáveis | Aluguel, insumos, comissões |
| Margem | Visão por procedimento/período |
| Dashboard | KPIs básicos da clínica |

**Valor:** visão de lucratividade — hoje espalhada em planilha.  
**Custo DR7:** baixo.

---

#### `fornecedores` — Cadastro de fornecedores
**Versão:** v5

| Funcionalidade | Detalhe |
|----------------|---------|
| Contatos | Fornecedores de insumos |
| Vínculo estoque | Qual fornecedor repõe cada item |
| Acelerar compra | Atalho a partir de alerta de estoque |

**Valor:** operacional — complementa estoque/financeiro.  
**Custo DR7:** baixo.

---

#### Base da plataforma (incluso em todos os planos pagos)

| Item | Detalhe | Versão |
|------|---------|--------|
| Auth + multi-usuário | E-mail/senha; roles admin/dentista | v2 |
| Trial 7 dias | Sem cartão | v2 |
| Exportação LGPD | ZIP JSON + CSV | v2 |
| Suporte DR7 | Canal definido comercialmente | v2+ |
| Mobile responsivo | Todas as telas | v1 ✅ |

---

### 7.2 Composição dos planos

#### Essencial — `essencial`
**Público:** dentista solo ou consultório individual — substituir caderno/planilha.

| Inclui | Não inclui |
|--------|------------|
| ✅ Módulo `agenda` | ❌ WhatsApp |
| ✅ Módulo `pacientes` (+ cadastro v2) | ❌ Agente IA |
| ✅ Auth, trial, exportação LGPD | ❌ Prontuário, estoque, financeiro |
| ✅ **1 dentista** incluso | ❌ Multi-dentista (upgrade → Conecta) |
| ➕ 2º dentista | Upgrade para **Conecta** (até 3 inclusos) ou política futura |

**Posicionamento vs mercado:** porta de entrada; produto mínimo, não mini-Completo.  
**Preço:** **R$ 99,00/mês** (§3.4).

---

#### Conecta — `conecta`
**Público:** clínica que quer atender pacientes pelo WhatsApp de forma profissional, sem IA.

| Inclui | Não inclui |
|--------|------------|
| ✅ Tudo do **Essencial** | ❌ Agente IA |
| ✅ Módulo `whatsapp` (real a partir v6) | ❌ Prontuário, estoque, financeiro |
| ✅ Templates de mensagem | |
| ✅ Inbox no app (substitui WhatsApp Web solto) | |
| ✅ **WhatsApp incluso** (uso clínico típico) | |

**Delta de valor vs Essencial:** WhatsApp integrado + histórico + templates — economiza tempo e profissionaliza.  
**Delta de custo DR7:** Meta API + n8n + número Business.  
**Preço:** **R$ 149,00/mês** (§3.4).

---

#### Inteligente — `inteligente`
**Público:** clínica sem recepção que quer **atendimento e agendamento automatizados** — core DR7.

| Inclui | Não inclui |
|--------|------------|
| ✅ Tudo do **Conecta** | ❌ Prontuário avançado, estoque, financeiro |
| ✅ Módulo `ai_agent` (v6.1) | |
| ✅ Knowledge base por clínica (pgvector) | |
| ✅ Agendamento automático via IA | |
| ✅ FAQ 24h personalizado | |
| ✅ Handoff para dentista | |
| ✅ **IA inclusa** (uso clínico típico) | |

**Delta de valor vs Conecta:** "secretária virtual" — responde, agenda, confirma sem humano.  
**Delta de custo DR7:** OpenAI tokens + embeddings + volume conversas — **maior custo variável**.  
**Preço:** **R$ 279,00/mês** (§3.4).

---

#### Completo — `completo`
**Público:** clínica que quer gestão integral — clínica + operação + financeiro.

| Inclui | Não inclui |
|--------|------------|
| ✅ Tudo do **Inteligente** | — |
| ✅ `prontuario` (v2.5–v3.5) | |
| ✅ `procedimentos` (v3) | |
| ✅ `estoque` (v4) | |
| ✅ `financeiro` (v5) | |
| ✅ `fornecedores` (v5) | |
| ✅ Novos módulos futuros enquanto assinatura ativa | |

**Delta de valor vs Inteligente:** ERP odontológico leve — prontuário, custos, estoque, margem.  
**Delta de custo DR7:** Storage (prontuário) + complexidade suporte.  
**Preço:** **R$ 349,00/mês** (lançamento; revisão R$ 399 pós v3–v5) + 5 GB storage (§3.4).

---

### 7.3 Matriz plano × módulo

| Módulo | Essencial | Conecta | Inteligente | Completo |
|--------|:---------:|:-------:|:-----------:|:--------:|
| `agenda` | ✅ | ✅ | ✅ | ✅ |
| `pacientes` | ✅ | ✅ | ✅ | ✅ |
| `whatsapp` | — | ✅ | ✅ | ✅ |
| `ai_agent` | — | — | ✅ | ✅ |
| `prontuario` | — | — | — | ✅ |
| `procedimentos` | — | — | — | ✅ |
| `estoque` | — | — | — | ✅ |
| `financeiro` | — | — | — | ✅ |
| `fornecedores` | — | — | — | ✅ |
| Plataforma (auth, LGPD, trial) | ✅ | ✅ | ✅ | ✅ |

---

### 7.4 Resumo plano × preço × módulos

| Plano | Preço/mês | Módulos | Inclusos |
|-------|-----------|---------|----------|
| **Essencial** | R$ 99,00 | agenda, pacientes | 1 dentista, 200 pacientes, auth, LGPD, trial |
| **Conecta** | R$ 149,00 | + whatsapp | 3 dentistas, WhatsApp uso clínico típico |
| **Inteligente** | R$ 279,00 | + ai_agent | + IA uso clínico típico, KB |
| **Completo** | R$ 349,00 | + prontuário, procedimentos, estoque, financeiro, fornecedores | + 5 GB storage/clínica |

**Adicionais (qualquer plano):** dentista/usuário extra **R$ 20/mês** · storage excedente **R$ 5/GB/mês** (Completo).

---

### 7.5 Storage Supabase — limites técnicos e comerciais

**Capacidade Supabase (2026):**

| Plano Supabase | File Storage | Database | Backups | Produção real? |
|----------------|-------------|----------|---------|----------------|
| **Free** ($0) | **1 GB** total | 500 MB | ❌ Nenhum | ❌ Pausa após 7 dias inativo |
| **Pro** ($25/mês) | **100 GB** incluídos | 8 GB | ✅ 7 dias | ✅ Recomendado produção |
| **Pro excedente** | +$0,021/GB/mês | +$0,125/GB/mês | — | — |

O prontuário (`patient_documents`) usa **Supabase Storage** — bucket por clínica.

**Estimativa uso por clínica pequena:**

| Tipo | Tamanho médio | Volume/ano | Storage/ano |
|------|---------------|------------|-------------|
| PDF laudo/RX | 1–3 MB | 50–150 docs | 50–450 MB |
| Foto intraoral JPG | 2–5 MB | 20–80 imgs | 40–400 MB |
| **Total típico** | — | — | **~200 MB – 1 GB/ano** |

**Limites comerciais sugeridos (Dental Seven):**

| Plano | Storage prontuário | Justificativa |
|-------|-------------------|---------------|
| Essencial / Conecta / Inteligente | Sem prontuário | Módulo não incluído |
| **Completo** | **5 GB/clínica** incluídos | ~5–10 anos de histórico típico |
| Excedente Completo | **R$ 5/GB/mês** (avulso) | DR7 paga ~R$ 0,11/GB (Pro overage $0,021) — margem ~45x |

**Capacidade agregada (Pro 100 GB):** ~20 clínicas Completo a 5 GB cada = 100 GB. Monitorar uso; upgrade Supabase ou cobrar excedente antes de encher.

**Dev vs produção (Supabase):** ver nota em §9.

---

## 9. Supabase — dev vs produção

**Não é obrigatório ter dois projetos desde o dia 1.** A recomendação de separar dev/prod existe por segurança e operação, não por limitação técnica.

| Cenário | Abordagem |
|---------|-----------|
| **Agora (sem clientes pagantes)** | Um projeto único serve para desenvolvimento **e** primeiros testes |
| **Primeiro cliente real com dados LGPD** | Migrar para **Supabase Pro ($25/mês)** no mesmo projeto **ou** criar projeto prod separado |
| **Por que não Free em produção** | Sem backup automático; pausa após 1 semana inativa; 1 GB storage total; 500 MB DB — risco para prontuários |
| **Dois projetos (ideal maduro)** | Dev (Free/local) + Prod (Pro) — migrations testadas em dev antes de prod |

**Conclusão:** podem usar o projeto atual (`gspkjgeemerhmzvfxinv`) como **produção futura**, desde que **upgrade para Pro** antes de clientes reais com dados de pacientes. Até lá, Free/local basta para v2.

---

## 8. Changelog

| Data | Alteração |
|------|-----------|
| 2026-06-15 | v1.0 — registro inicial de ideias |
| 2026-06-15 | v1.1 — decisões aprovadas; pesquisa de planos; preços sugeridos; referência v2 spec |
| 2026-06-15 | v1.2 — nomes aprovados; descritivo comercial §7; v1 smoke mobile concluído |
| 2026-06-15 | v1.6 — **oficial §3.4:** Inteligente R$ 279; Meta absorvida/zero vitrine; sem implantação; caps 1.200/1.500/2.500/3.500 |
