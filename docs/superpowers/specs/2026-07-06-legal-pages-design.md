# Dental Seven — Termos de Uso e Política de Privacidade Design Spec

**Versão:** 1.0  
**Data:** 2026-07-06  
**Status:** Aprovada — implementada em 2026-07-06  
**Branch:** `feat/v2`  
**Base legal:** Textos DR7 Performance (jun/2026) adaptados para o SaaS Dental Seven  
**Fontes:**  
- https://www.dr7performance.com.br/termos_de_uso  
- https://www.dr7performance.com.br/politica_de_privacidade  

---

## 1. Objetivo

Publicar **Termos de Uso** e **Política de Privacidade** do Dental Seven no app, em conformidade com **LGPD** e **Marco Civil**, reutilizando a estrutura jurídica já validada pela DR7 no site institucional — **sem advogado nesta fase**, com revisão profissional futura.

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Conteúdo em **markdown estático** no repo (`src/content/legal/`) |
| 2 | Páginas públicas `/termos` e `/privacidade` (sem login) |
| 3 | **Mesma controladora** do site DR7: MEI Dilson Ramos / CNPJ 52.895.412/0001-30 |
| 4 | Dental Seven = **produto SaaS** da DR7; não duplicar CNPJ |
| 5 | Papéis LGPD: **clínica = controladora** dos dados de pacientes; **DR7 = operadora** da plataforma |
| 6 | Checkbox obrigatório no **cadastro** + registro `terms_accepted_at` em `profiles` |
| 7 | Links em `/entrar`, `/cadastro` e rodapé mínimo nas páginas legais |
| 8 | Convite de dentista: aceite implícito ao criar senha (v1) — **backlog** checkbox no convite |
| 9 | Versão e data no topo: **6 de julho de 2026** |
| 10 | Disclaimer no rodapé das páginas: *"Rascunho adaptado dos termos DR7; revisão jurídica pendente"* — **opcional**, recomendação: **não exibir** na UI pública (só nota interna na spec) |

---

## 3. Adaptações em relação ao site DR7

### 3.1 Termos de Uso

| Seção DR7 (site) | Adaptação Dental Seven |
|------------------|------------------------|
| Objeto: site institucional | Objeto: **plataforma web Dental Seven** (agenda, pacientes, prontuário, módulos por plano) |
| Demonstrações e vitrines | **Conta trial 7 dias**, planos Essencial–Completo, beta pode ter funcionalidades rotuladas |
| Serviços contratados | **Assinatura mensal** via Asaas; escopo por plano e `clinic_modules` |
| Uso permitido | Uso lícito; **dados de pacientes** só para fins clínicos/administrativos; proibição de compartilhar credenciais |
| Responsabilidades do cliente | Clínica responsável por **consentimentos**, **CFM/CFO**, publicidade em saúde, dados de pacientes |
| Propriedade intelectual | Software Dental Seven = DR7; **dados da clínica** pertencem à clínica |
| Limitação de responsabilidade | Manter estrutura DR7; mencionar **indisponibilidade de terceiros** (Supabase, Meta, Asaas) |
| Privacidade | Referência cruzada à `/privacidade` |
| Foro | Rio Preto da Eva/AM (manter) |

**Seções novas específicas Dental Seven:**

- **Módulos e planos** — funcionalidades variam por plano; WhatsApp/IA podem estar em beta ou "em breve"
- **Contas e papéis** — `clinic_admin`, `dentist`, convites por e-mail
- **Dados e portabilidade** — exportação LGPD já disponível em Configurações
- **Encerramento** — fluxo de encerramento de conta existente

### 3.2 Política de Privacidade

| Seção DR7 (site) | Adaptação Dental Seven |
|------------------|------------------------|
| Escopo: site + canais | Escopo: **app Dental Seven** + cadastro + suporte + billing |
| Dados do visitante do site | Dados do **usuário da clínica** (admin, dentista) + **pacientes** cadastrados pela clínica |
| Bases legais LGPD | Manter art. 7º; **execução de contrato** (assinatura); **legítimo interesse** (segurança) |
| Operadores / subprocessadores | **Supabase** (banco + auth + storage), **Vercel** (hosting), **Asaas** (pagamentos), **Resend** (e-mail, se configurado), **Meta** (quando WhatsApp real — futuro) |
| Dados sensíveis | **Prontuário** pode conter dados de saúde — clínica define base legal; DR7 como operadora |
| Retenção | Durante assinatura + **90 dias** pós-encerramento (alinhado export/soft delete) |
| Direitos do titular | Acesso, correção, exclusão, portabilidade — canal `contato@dr7performance.com.br` + export in-app |
| Papéis controlador/operador | Tabela explícita (ver §4) |
| Meta/WhatsApp §7 DR7 | **Encurtar** para Dental Seven: quando módulo ativo, mesmas regras; hoje inbox pode ser demonstração |

**Seções que reaproveitamos quase integralmente:**

- Identificação do prestador (MEI, CNPJ, endereço, contatos)
- Bases legais LGPD
- Direitos do titular e prazo 15 dias
- Segurança e medidas técnicas (genéricas)
- Alterações da política
- Legislação e foro

---

## 4. Papéis LGPD no Dental Seven

| Papel | Quem | Dados | Papel LGPD |
|-------|------|-------|------------|
| DR7 Performance | Prestador do SaaS | Dados de conta, billing, logs, suporte | **Controladora** (dados comerciais do cliente) + **Operadora** (dados de pacientes inseridos pela clínica) |
| Clínica (`clinic_admin`) | Contratante | Pacientes, prontuário, agenda, documentos | **Controladora** dos dados de pacientes e equipe |
| Dentista | Usuário | Próprio perfil, evoluções, documentos que gera | Usuário autorizado; tratamento sob instrução da clínica |
| Paciente | Titular | Nome, contato, saúde (prontuário) | **Titular**; direitos via clínica ou DR7 (canal de apoio) |

---

## 5. UI e integração técnica

### 5.1 Rotas públicas

| Rota | Componente |
|------|------------|
| `/termos` | `src/app/termos/page.tsx` |
| `/privacidade` | `src/app/privacidade/page.tsx` |

- Layout simples: logo Dental Seven, título, conteúdo renderizado de markdown, links cruzados, voltar para `/entrar`
- **Sem** exigir auth (já em `PUBLIC_PATHS` do middleware — adicionar rotas)

### 5.2 Conteúdo

```
src/content/legal/
  termos-de-uso.md
  politica-de-privacidade.md
```

Renderização: componente `LegalDocumentPage` que lê MD e aplica estilos prose (Tailwind typography ou classes existentes).

### 5.3 Cadastro

- Checkbox: *"Li e aceito os [Termos de Uso](/termos) e a [Política de Privacidade](/privacidade)"*
- `signupClinic` valida `acceptedTerms: true`
- Migration `018_profiles_terms_accepted.sql`: `terms_accepted_at timestamptz`

### 5.4 Links

- `cadastro-form.tsx` — checkbox + links
- `entrar-form.tsx` — texto pequeno no rodapé do form
- `configuracoes/page.tsx` — links na seção Conta (opcional v1)

---

## 6. O que NÃO fazer na v1

- Cookie banner complexo (só cookies essenciais de sessão Supabase)
- DPA PDF separado para cada clínica
- Versão em inglês
- CMS/admin para editar textos in-app
- Aceite reforçado no convite de dentista (backlog)

---

## 7. Critérios de aceite

- [ ] `/termos` e `/privacidade` acessíveis sem login
- [ ] Textos adaptados de DR7 com foco LGPD e papéis controlador/operador
- [ ] Menção a Supabase, Asaas, export LGPD, prontuário
- [ ] Checkbox obrigatório no cadastro
- [ ] `terms_accepted_at` gravado no signup
- [ ] Links em entrar e cadastro
- [ ] `npm run test` e `npm run build` passam

**Plano:** `docs/superpowers/plans/2026-07-06-legal-pages.md`

---

## 8. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Texto sem revisão jurídica | Base DR7 já estruturada em LGPD; revisão advogado na OS antes de marketing massivo |
| Clínica como controladora sem política própria | Termos orientam clínica a informar pacientes; backlog política modelo para clínica |
| Dados de saúde | Seção explícita; export e encerramento já existem |

---

## 9. Próximo passo

Após aprovação desta spec: **writing-plans** → implementação (markdown + páginas + migration + cadastro).
