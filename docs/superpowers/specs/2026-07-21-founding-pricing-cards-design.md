# Dental Seven — Founding pricing: cards horizontais

**Data:** 2026-07-21  
**Status:** aprovado (mockup Visual Companion · Dilson)  
**Escopo:** só UI da seção de planos em `/founding`  
**Relacionada:** `2026-07-20-precificacao-oficial.md`

## Decisão

Substituir a **tabela** por **4 cards lado a lado** (largura igual).

| Item | Decisão |
|------|---------|
| Layout | Grid 4 colunas no desktop; scroll horizontal no mobile (`min-width` ~240px) |
| Destaque | Conecta com borda primary + ★ (âncora) |
| Label | **Economia** (antes “Ganho anual”); **Fundadores (12×)** (antes Founding) |
| Conteúdo do card | Nome · lista/mês · Fundadores 12× (ou —) · Economia (ou —) · lista **Inclui** completa e cumulativa (sem “Tudo do…”) |
| Dados | Continuar em `pricing-phases.ts` — sem mudar números |

## Fora de escopo

- Landing pós-beta (`launch`)
- Notificações in-app / e-mail
- WhatsApp WIP

## Aceite

- `/founding` mostra 4 cards comparáveis
- Texto “Economia” visível
- Cada card lista o que o plano inclui
- Deploy produção após merge `main`
