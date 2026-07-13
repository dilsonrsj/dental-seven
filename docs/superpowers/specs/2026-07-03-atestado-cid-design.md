# Dental Seven — CID no Atestado Odontológico Design Spec

**Versão:** 1.0  
**Data:** 2026-07-03  
**Status:** Implementado — aceite §11 em 2026-07-03  
**Pré-requisito:** Módulo Prontuário v2.5+ com geração de PDF clínico (`atestado`)  
**Branch:** `feat/v2` apenas — `main`/Vercel demo intocável

**Fontes regulatórias:**
- [Manual do Prontuário — CFO (2026)](https://website.cfo.org.br/wp-content/uploads/2026/03/CFO_Manual_do_Prontuario_Ebook_v2.pdf) — Anexo 6 (atestados)
- [Resolução SEC/CFO nº 87/2009](https://sistemas.cfo.org.br/visualizar/atos/RESOLU%C3%87%C3%83O/SEC/2009/87)
- [CID-10 DATASUS — Capítulo XI K00–K14](http://www2.datasus.gov.br/cid10/V2008/WebHelp/k00_k14.htm)

---

## 1. Objetivo

Permitir que o cirurgião-dentista inclua um **código CID-10** no atestado odontológico gerado em PDF, com **autorização expressa do paciente**, dropdown com código + descrição resumida, e redação alinhada ao Manual CFO.

---

## 2. Problema

O atestado atual (`buildAtestadoLines`) gera apenas dias de afastamento e motivo livre opcional — **sem CID**. Empregadores e convênios frequentemente exigem código para justificar afastamento. O CFO orienta que o CID só conste no documento com pedido/autorização do paciente.

---

## 3. Decisões

| # | Decisão |
|---|---------|
| 1 | **Checkbox** *"Paciente autoriza inclusão do CID no atestado"* antes de habilitar o campo CID |
| 2 | Com checkbox marcado, **CID é obrigatório** no dropdown |
| 3 | **Lista curada estática** (~35 códigos) do capítulo **K00–K14** (odontologia), sem API externa |
| 4 | Dropdown nativo `<select>` com `optgroup` por categoria; opção: `K04.0 — Pulpite` |
| 5 | PDF com redação CFO quando há CID autorizado; fluxo sem autorização **inalterado** |
| 6 | **Sem migration** — CID persiste apenas no PDF em `patient_documents` (storage) |
| 7 | Motivo livre permanece **opcional** em ambos os fluxos |

---

## 4. Escopo

### Incluído

- Catálogo `dental-cid-list.ts` com códigos K00–K14 mais usados em atestado
- UI: checkbox + select no formulário de atestado (`clinical-document-form.tsx`)
- Validação server-side em `clinical-document-input.ts`
- Extensão de `AtestadoPayload` e `buildAtestadoLines`
- Testes Vitest (input, linhas do PDF)

### Fora de escopo

- Busca/filtro no dropdown (combobox)
- CID em receita ou guia de exame
- Coluna `metadata` em `patient_documents`
- CIDs fora de K00–K14 (ex. M79.1 mialgia)
- Assinatura digital ICP-Brasil
- Atualização automática do CID-11

---

## 5. UX — Formulário

Ordem dos campos no template **Atestado**:

1. **Dias de afastamento** (obrigatório, 1–365) — inalterado
2. **Checkbox:** *Paciente autoriza inclusão do CID no atestado*
   - Texto de ajuda: *"Conforme orientação do CFO, o CID só deve constar no atestado com autorização expressa do paciente."*
3. **CID** (`<select>`) — visível e habilitado somente com checkbox marcado
   - Placeholder: *Selecione o CID*
   - Formato: `K04.0 — Pulpite`
   - Agrupado por `optgroup` (ex.: *Cárie e polpa*, *Gengiva e periodonto*)
   - Obrigatório quando checkbox marcado
4. **Motivo (opcional)** — inalterado

**Validação:**
- Checkbox marcado + CID vazio → `Selecione o CID autorizado pelo paciente.`
- Checkbox desmarcado → `cidCode` ignorado mesmo se enviado

---

## 6. Texto do PDF

### Sem autorização (comportamento atual)

```
Paciente: {nome}

Atesto, para os devidos fins, que o(a) paciente acima necessita de afastamento de suas atividades por {N dias}.

Motivo: {opcional}
```

### Com autorização + CID

```
Paciente: {nome}

Atesto, a pedido do interessado, inclusive com menção de CID por este(a) solicitada, que o(a) paciente acima necessita de afastamento de suas atividades por {N dias}, em virtude de CID-11 nº {code} — {label}.

Motivo: {opcional, linha separada se preenchido}
```

---

## 7. Modelo de dados (TypeScript)

```typescript
// clinical-document-input.ts
export type ClinicalDocumentFormInput = {
  // ...existentes
  cidPatientAuthorized?: boolean;
  cidCode?: string;
};

// templates/types.ts
export type AtestadoPayload = ClinicalDocumentContext & {
  template: "atestado";
  daysOff: number;
  reason?: string | null;
  cidPatientAuthorized: boolean;
  cid?: { code: string; label: string } | null;
};
```

**Mapeamento:**
- `cidPatientAuthorized === true` + `cidCode` válido → `cid: { code, label }` via `getDentalCidByCode`
- Caso contrário → `cidPatientAuthorized: false`, `cid: null`

---

## 8. Catálogo CID (lista curada)

Arquivo: `src/modules/prontuario/data/dental-cid-list.ts`

| Categoria | Códigos (exemplos) |
|-----------|-------------------|
| Desenvolvimento e erupção | K00.6, K01.0, K01.1 |
| Cárie e polpa | K02.1, K02.9, K04.0, K04.1, K04.4, K04.7, K04.8 |
| Gengiva e periodonto | K05.0, K05.2, K05.3, K05.5, K06.0 |
| Oclusão e ATM | K07.6 |
| Perda e estruturas | K08.1, K08.3, K08.8 |
| Cistos | K09.0 |
| Maxilares | K10.2, K10.3 |
| Glândulas salivares | K11.2, K11.5 |
| Mucosa e boca | K12.0, K12.1, K12.2, K13.0, K13.7 |
| Língua | K14.0, K14.6 |

Descrições em português conforme CID-10 SVS/DATASUS. Lista completa definida no plano de implementação.

---

## 9. Arquivos

| Arquivo | Ação |
|---------|------|
| `src/modules/prontuario/data/dental-cid-list.ts` | Criar |
| `src/modules/prontuario/templates/types.ts` | Modificar |
| `src/modules/prontuario/templates/atestado.ts` | Modificar |
| `src/modules/prontuario/templates/atestado.test.ts` | Criar |
| `src/modules/prontuario/clinical-document-input.ts` | Modificar |
| `src/modules/prontuario/clinical-document-input.test.ts` | Modificar |
| `src/modules/prontuario/clinical-document-form.tsx` | Modificar |

---

## 10. Testes

| Caso | Esperado |
|------|----------|
| Atestado sem autorização | Payload sem `cid`; texto legado |
| Autorização sem CID | `validateClinicalDocumentInput` lança erro |
| Autorização + CID válido | Payload com `cid`; texto CFO no PDF |
| CID inválido/desconhecido | Erro de validação |
| Motivo opcional com CID | Ambos no PDF |

Comando: `npm run test` — suite existente + novos testes deve passar.

---

## 11. Critérios de aceite

- [x] Checkbox desabilita/habilita dropdown CID
- [x] Não é possível gerar atestado com autorização sem CID selecionado
- [x] PDF sem autorização idêntico ao comportamento anterior
- [x] PDF com autorização exibe código + descrição e redação CFO
- [x] Dropdown mostra ~35 CIDs odontológicos com resumo
- [x] `npm run test` e `npm run build` passam

---

## 12. Plano de implementação

`docs/superpowers/plans/2026-07-03-atestado-cid.md`
