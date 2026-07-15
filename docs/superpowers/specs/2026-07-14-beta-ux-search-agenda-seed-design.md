# Dental Seven — UX beta: busca live, Nova Consulta, overlap, seed (design)

**Data:** 2026-07-14  
**Status:** Aprovado para implementação (usuário: “já parta”)  
**Branch:** `main` (dev local; **sem deploy** até pacote completo)  
**Relacionados:** agenda, pacientes, signup beta

---

## 1. Respostas

| Pedido | Viável? | Nota |
|--------|---------|------|
| Digitar e ver matches em dropdown | **Sim** | Hoje só há busca em Pacientes (submit GET). Autocomplete aplicada neles + qualquer outra busca de lista (admin clínicas, seletiva do modal se for “busca”) |
| “Nova Consulta” abre modal direto | **Sim** | Já passa `?patientId=`; falta auto-abrir o modal |
| Bloquear mesmo horário | **Sim** | Mesmo dentista + intervalo cruzado; status ≠ cancelled |
| Seed fictício no cadastro beta | **Sim** | Só com `DENTAL_SEVEN_BETA_GATE`; novas clínicas no signup |

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Autocomplete: debounce ~200ms; lista max 8; Enter/clique abre ficha (pacientes) ou seleciona item |
| 2 | Escopo busca app clínico nesta entrega: **Pacientes** (única busca textual); no modal de consulta, trocar `<select>` de paciente por combobox filtrável |
| 3 | Nova Consulta: `/agenda?patientId=&new=1` → `modalOpen` true + `initialPatientId` |
| 4 | Overlap: `starts_at < other.ends_at AND ends_at > other.starts_at`, mesmo `dentist_id`, exclui `cancelled` e o próprio id em edit |
| 5 | Seed beta pós-`signupClinic`: ~10 pacientes, ~5 procedimentos, insumos+BOM, 3–5 consultas, entradas financeiras mínimas se o fluxo já as gera ao completar |
| 6 | **Sem deploy** nesta onda |

---

## 3. Design por fatia

### A — Autocomplete pacientes
- Client component `PatientSearchField` no `PatientList`: input controlado + dropdown absoluto
- Action `searchPatientsLite(term)` reutiliza `getPatients` (limit 8)
- Manter botão Buscar / lista full page como fallback (ou só typeahead + list sync)

### B — Nova Consulta
- Header: `href={`/agenda?patientId=${id}&new=1`}`
- `AgendaPageClient`: se `searchParams.new` ou `initialOpenNew`, `useState(true)` para modal

### C — Overlap
- Pure function `findOverlappingAppointment(...)` + teste
- Chamar em `upsertAppointment` antes do insert/update
- Mensagem: “Já existe consulta neste horário para este dentista.”

### D — Seed beta
- `src/lib/beta/seed-clinic-demo.ts` — inserts via admin client no `clinicId` novo
- Chamado no fim de `signupClinic` se `isBetaGateEnabled()`
- Dados realistas PT-BR, sem depender de `DEMO_MOCK_DATA`

---

## 4. Aceite

- [x] Digitar em Pacientes mostra dropdown com matches
- [x] Nova Consulta na ficha abre modal com paciente certo
- [x] Segunda consulta overlapping falha com erro claro
- [x] Novo cadastro beta chega com pacientes/serviços/consultas
- [x] Sem deploy produção
