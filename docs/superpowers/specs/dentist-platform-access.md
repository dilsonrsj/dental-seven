# Dental Seven — Acesso do dentista na plataforma completa

**Status:** documento vivo — visão pós-desenvolvimento completo (v1 → v6.1+)  
**Público:** comercial DR7, produto, desenvolvimento, onboarding de clínicas  
**Spec base:** `2026-06-11-dental-seven-mvp-design.md`

---

## 1. Para que serve este documento

Descreve **o que o dentista** (papel `dentist` em `profiles`) pode ver e fazer em cada módulo, em cada marco do produto, quando o Dental Seven estiver **100% desenvolvido**.

Use este arquivo para:

- Apresentações comerciais (“o que seu dentista ganha com o sistema”)
- Alinhar escopo de cada versão com o time de dev
- Validar permissões (RLS + UI) antes de fechar uma release
- Onboarding pós-v2 (“o que muda quando você entra como dentista vs. dono da clínica”)

**Como manter atualizado:** ao fechar cada versão, atualizar a coluna da versão na matriz (§4) e marcar ✅ na coluna **Status**.

---

## 2. Persona

| Atributo | Descrição |
|----------|-----------|
| **Quem** | Dentista que atende na clínica (1–3 profissionais no público-alvo) |
| **Contexto** | Sem recepção dedicada; usa o app **entre consultas** e no **celular** |
| **Papel técnico** | `profiles.role = dentist`, `profiles.dentist_id` vinculado ao cadastro em `dentists` |
| **Escopo de dados** | Sempre `clinic_id` da clínica; preferência por **filtro automático** na própria agenda e nos pacientes que atende |

### Diferença em relação ao dono (`clinic_admin`)

| Área | `clinic_admin` (dono) | `dentist` |
|------|------------------------|-----------|
| Billing / plano / trial | ✅ | ❌ |
| Convidar usuários / roles | ✅ | ❌ |
| Configurar módulos e integrações | ✅ | ❌ |
| Exportação LGPD / encerrar conta | ✅ | ❌ |
| Cadastrar outros dentistas | ✅ | ❌ |
| Agenda da clínica | ✅ todos | ✅ **própria** + leitura da clínica conforme política |
| Pacientes | ✅ CRUD completo | ✅ ficha + anotações; cadastro conforme política da clínica |
| WhatsApp inbox | ✅ | ✅ responder + handoff do agente IA |
| Prontuário / documentos | ✅ | ✅ dos **seus** pacientes/consultas |
| Financeiro / estoque | ✅ visão gerencial | 🔶 leitura operacional (ver §4) |

---

## 3. Princípios de UX para o dentista

1. **Mobile-first na agenda** — visão “Hoje” como padrão no celular.
2. **Menos cliques** — confirmar consulta, ver ficha, responder WhatsApp em poucos toques.
3. **Filtro por profissional** — dentista logado vê **sua** cor na agenda por padrão (pode alternar se a clínica permitir).
4. **Sem telas de cobrança** — paywall e Asaas só para `clinic_admin`.
5. **Handoff IA → humano** — no plano Inteligente, o dentista **assume** a conversa no inbox quando quiser.

---

## 4. Matriz de acesso por módulo (plataforma completa)

Legenda: **✅** acesso total · **👁** somente leitura · **🔶** parcial / configurável · **❌** sem acesso · **—** módulo inexistente nesta versão

### 4.1 Agenda (`/agenda`) — v1+

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Visão semanal (grade 08h–18h) | ✅ | v1 | ✅ MVP |
| Visão “Hoje” (mobile) | ✅ | v1 | ✅ MVP |
| Criar / editar consulta | ✅ | v1 | ✅ MVP |
| Confirmar / cancelar / reagendar | ✅ | v1 | ✅ MVP |
| Filtrar por dentista | ✅ (próprio por padrão) | v1 | ✅ MVP |
| Ver agenda de outros dentistas | 👁 | v2+ | planejado |
| Status `completed` e gatilhos (estoque/financeiro) | ✅ marcar concluída | v4–v5 | planejado |

### 4.2 Pacientes (`/pacientes`) — v1+

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Lista com busca | ✅ | v1 | ✅ MVP |
| Ficha do paciente | ✅ | v1 | ✅ MVP |
| Editar anotações clínicas | ✅ | v1 | ✅ MVP |
| Histórico de consultas | 👁 | v1 | ✅ MVP |
| Cadastrar novo paciente | 🔶 política clínica | v2 | planejado |
| Atalho “agendar” da ficha | ✅ | v1 | ✅ MVP |

### 4.3 WhatsApp (`/whatsapp`) — v1 simulado · v6 real

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Inbox por paciente | ✅ | v1 | ✅ demo |
| Ver histórico de mensagens | ✅ | v1 | ✅ demo |
| Templates: confirmar / reagendar / lembrete | ✅ | v6 | planejado |
| Resposta manual (composer) | ✅ | v6 | planejado |
| Receber handoff do agente IA | ✅ | v6.1 | planejado |
| Configurar número / templates Meta | ❌ (só admin) | v6 | planejado |

### 4.4 Prontuário (`/prontuario`) — v2.5 + v3.5

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Upload histórico externo (PDF/imagem) | ✅ | v2.5 | planejado |
| Viewer inline de documentos | ✅ | v3.5 | planejado |
| Evolução / registro por consulta | ✅ | v3.5 | planejado |
| Receita, atestado, guia + assinatura + PDF | ✅ | v3.5 | planejado |
| Enviar documento ao paciente via WhatsApp | ✅ | v6 | planejado |

### 4.5 Procedimentos (`/procedimentos`) — v3

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Consultar catálogo da clínica | 👁 | v3 | planejado |
| Selecionar procedimento na consulta | ✅ | v3 | planejado |
| Editar catálogo / preços / BOM | ❌ (admin) | v3 | planejado |

### 4.6 Estoque (`/estoque`) — v4

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Ver alertas de insumo baixo | 👁 | v4 | planejado |
| Baixa automática ao concluir procedimento | — (automático) | v4 | planejado |
| Entrada/saída manual de estoque | ❌ (admin) | v4 | planejado |

### 4.7 Financeiro (`/financeiro`) — v5

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Ver receita das **próprias** consultas | 🔶 | v5 | planejado |
| Comissões por dentista | 👁 | backlog | ideia |
| DRE / custos fixos / fornecedores | ❌ | v5 | planejado |

### 4.8 Agente IA (plano Inteligente) — v6.1

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Agente atende 24h no WhatsApp | — (automático) | v6.1 | planejado |
| Agendar via conversa (tools n8n) | — (automático) | v6.1 | planejado |
| Assumir conversa (handoff humano) | ✅ | v6.1 | planejado |
| Editar KB / tom de voz do agente | ❌ (admin) | v6.1 | planejado |

### 4.9 Configurações e conta — v2+

| Funcionalidade | Dentista | Versão | Status |
|----------------|----------|--------|--------|
| Plano, billing, trial | ❌ | v2 | planejado |
| Exportar dados LGPD | ❌ | v2 | planejado |
| Perfil pessoal (nome, e-mail, senha) | ✅ | v2 | planejado |
| Notificações / preferências | 🔶 | v2+ | planejado |

---

## 5. Acesso por plano comercial (visão do dentista)

O dentista **não escolhe o plano** — a clínica contrata. O que muda para ele é **quais módulos aparecem no menu** (`clinic_modules` + `plan_key`).

| Plano | O que o dentista usa no dia a dia |
|-------|-----------------------------------|
| **Essencial** | Agenda + Pacientes |
| **Conecta** | + WhatsApp (inbox e templates) |
| **Inteligente** | + Agente IA (handoff para o dentista no inbox) |
| **Completo** | Todos os módulos (prontuário, procedimentos, estoque, financeiro) |

Trial 7 dias: dentista entra normalmente; se o trial expirar, vê paywall (só o `clinic_admin` regulariza).

---

## 6. Linha do tempo (versões)

```
v1  MVP demo     → Agenda, Pacientes, WhatsApp simulado
v2  Produto      → Login, roles (dentist vs admin), pacientes novo, LGPD
v2.5 Prontuário  → Upload de histórico
v3  Procedimentos → Catálogo + BOM na consulta
v3.5 Prontuário  → Viewer, evolução, receita/atestado
v4  Estoque      → Alertas + baixa automática
v5  Financeiro   → Receita, fornecedores
v6  WhatsApp real → n8n + Meta Cloud API
v6.1 Agente IA   → OpenAI + KB + handoff
```

---

## 7. Onde isso vira código (referência técnica)

| Camada | Implementação futura |
|--------|----------------------|
| Papel | `profiles.role`, `profiles.dentist_id` |
| Menu | Nav condicional por `clinic_modules` |
| Dados | RLS Supabase filtrando `clinic_id` (+ `dentist_id` onde aplicável) |
| UI | Esconder rotas `/configuracoes` billing, `/admin` para `dentist` |
| Demo MVP | Sem roles — um único usuário demo vê tudo |

---

## 8. Uso comercial (texto resumido para apresentação)

> **Com o Dental Seven completo, o dentista tem no bolso:** agenda da clínica e visão do dia, ficha e histórico de cada paciente, prontuário e documentos, inbox WhatsApp com confirmação e lembrete em um toque — e, no plano Inteligente, uma secretária virtual que agenda e responde dúvidas 24h, passando a conversa para o dentista quando ele quiser assumir.

---

*Dental Seven — DR7 Performance. Atualizar este doc a cada release.*
