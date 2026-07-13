# Dental Seven — Agenda: horários e navegação semanal Design Spec

**Versão:** 1.0  
**Data:** 2026-07-03  
**Status:** Aprovado (brainstorming 2026-07-03)  
**Branch:** `feat/v2`

---

## 1. Objetivo

Permitir que a clínica configure dias/horários de funcionamento e cada dentista configure dias/horários de atendimento (subset da clínica); exibir grade semanal dinâmica e navegação entre semanas.

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Clínica define dias + bloco contínuo início/fim por dia |
| 2 | Dentista define dias + horário dentro da clínica |
| 3 | Validação: dentista ⊆ clínica |
| 4 | v1: um bloco/dia (sem almoço) |
| 5 | Config em `/configuracoes` — admin clínica; dentista *Meus horários* |
| 6 | Navegação `← Anterior | label | Próxima → | Hoje` no modo Semana |
| 7 | `day_of_week`: 0=seg … 6=dom |

---

## 3. Modelo de dados

Tabelas `clinic_operating_hours` e `dentist_operating_hours` (7 linhas por entidade).

Backfill Smoke Test: seg–sex 08:00–18:00; sáb/dom fechados.

---

## 4. Agenda

- Grade: min/max horários efetivos da semana (clínica ∩ filtro dentista)
- Colunas fechadas: fundo acinzentado
- Validar agendamento no horário do dentista

---

## 5. Critérios de aceite

- [ ] Admin configura horário da clínica em `/configuracoes`
- [ ] Dentista (ou admin) configura horários do dentista
- [ ] Semana anterior/próxima na toolbar
- [ ] Grade não fixa em 8–18
- [ ] Consulta fora do horário rejeitada
- [ ] `npm run test` e `npm run build` passam

**Plano:** `docs/superpowers/plans/2026-07-03-agenda-horarios.md`
