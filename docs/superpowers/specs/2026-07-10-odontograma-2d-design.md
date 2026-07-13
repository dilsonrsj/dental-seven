# Odontograma 2D — Design (2026-07-10)

**Decisão:** abandonar odontograma 3D (peso WebGL/GLB) em favor de SVG interativo no prontuário.

## Objetivo

Visualização e interação da arcada completa (32 dentes FDI) com seleção por dente, status clínico por cor e painel de histórico existente.

## Arquitetura

| Arquivo | Responsabilidade |
|---------|------------------|
| `data/dental-data.ts` | JSON dos 32 dentes (id, quadrant, group, name, roots) |
| `data/tooth-paths.ts` | Layout e paths SVG placeholder (coroa + raízes) |
| `data/records-map.ts` | Mapa status clínico por dente |
| `viewers/dental-chart.tsx` | Componente SVG interativo |
| `viewers/dental-chart.module.css` | Estilos `.selected`, hover, status |
| `viewers/odontogram-section.tsx` | Orquestra chart + `ToothDetailPanel` |

## Interação

- Cada dente = `<g id="tooth-XX">` com `crown-XX` e `root-XX-N`
- Clique em coroa ou raiz → `selectedTooth` (controlado pelo section)
- Classe `.selected` altera cor/opacidade de todo o grupo
- Status clínico via `recordsByTooth` + cores de `tooth-status.ts`

## Identidade DR7

- Fundo `#0d0d0f`, dentes cinza `#8f9196`
- Seleção/hover em `#4490E2` (primary)
- A seção termina no odontograma/painel clínico; não exibir chips promocionais ou explicativos abaixo do gráfico.

## Próximo passo

Substituir paths geométricos em `tooth-paths.ts` por paths SVG finais (designer ou export Illustrator/Figma).

## Removido

- Three.js, R3F, drei, GLB, viewers 3D, `public/models/`
