# Agenda UX — combobox paciente, apagar, valor ao concluir (design)

**Data:** 2026-07-14  
**Status:** Aprovado (usuário: overlap OK; Apagar = hard delete recomendado; valor particular editável)  
**Sem deploy** até pacote + pedido explícito

## Decisões

1. **Paciente no modal:** um único input; digitar filtra; lista dropdown; clique seleciona (sem `<select>`).
2. **Apagar:** exclusão definitiva no banco (+ limpeza estoque/financeiro se necessário).
3. **Valor ao concluir:** se `status=completed` e `payment_source=particular`, mostrar campo valor (pré-preenchido do procedimento), editável; ao **Salvar**, o valor confirma e alimenta o ledger financeiro (override do `base_price_cents`).

## Aceite

- [x] Paciente: só o campo de busca + lista
- [x] Apagar remove a consulta da agenda
- [x] Concluir particular → valor aparece, edita, salva → aparece no Financeiro
