# Dental Seven — Odontograma 3D Interativo Design Spec

**Versão:** 2.0  
**Data:** 2026-07-09  
**Status:** Aprovada (2026-07-09) — pré-beta item 4, AHA deploy beta  
**Branch:** `feat/v2`  
**Guia:** `docs/superpowers/GUIA-MASTER.md` — **v3.6 (pós-deploy beta)**  
**Referência UX:** concorrência (arcada 3D, rotação, clique → histórico) — jul/2026  
**Skill obrigatória:** `.agents/skills/3d-web-experience` (instalada via `npx skills add`)

---

## 1. Objetivo

Odontograma **interativo** no prontuário: arrastar para girar a arcada 3D, clicar no dente para ver **histórico clínico** daquela unidade (FDI), com destaque por cor conforme status. Se o 3D não atingir qualidade/performance aceitável, entregar **fallback 2D realista** em duas incidências (oclusal + raízes).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | **Stack 3D:** React Three Fiber + drei — conforme skill `3d-web-experience` (Next.js → R3F) |
| 2 | **Fallback obrigatório:** 2D dupla vista (oclusal + vestibular/raízes) — mesmo dado, mesma API |
| 3 | Spike técnico de 1–2 dias antes de comprometer 3D em produção |
| 4 | 32 dentes permanentes FDI; sem decíduos v1 |
| 5 | Clique no dente → **painel lateral/popover** com histórico (notas clínicas + eventos do dente) |
| 6 | Cores: dentes neutros (cinza matte); selecionado/status = **primary DR7** (`oklch(0.63 0.15 250)`) |
| 7 | Estado inicial: arcada neutra, sem poluição visual |
| 8 | Dados: `patient_tooth_records` (status atual) + join com `patient_clinical_notes` e `appointments` |
| 9 | Edição de status no painel (não só leitura) — modal simplificado |
| 10 | Plano de tratamento automático: **fora v1** (visão futura) |
| 11 | Módulo `prontuario`; local: `/pacientes/[id]/prontuario` seção dedicada no topo |

---

## 3. Abordagens consideradas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **A — R3F + GLTF por dente (Recomendado)** | Rotação 360°; UX premium; alinhado referência | Bundle +3D; modelo 3D a obter/criar |
| B — Three.js vanilla | Controle total | Mais boilerplate que R3F |
| **C — Fallback 2D dupla vista (Obrigatório)** | Leve; previsível; funciona em mobile fraco | Menos “wow” |
| D — Apenas 2D minimalista (rejeitado) | Já tentado | UX rejeitada pelo usuário |

**Estratégia:** Camada de dados única + dois renderers. Implementação 3D **deve seguir** checklist da skill: `Suspense` + loader, compressão GLB (Draco), fallback WebGL, `dpr` mobile = 1.

---

## 3.1 Referência concorrência → DR7

Padrões a replicar (não copiar pixel-a-pixel):

| Elemento concorrência | Adaptação DR7 |
|----------------------|---------------|
| Headline "Gire, clique e explore" | Hint: *Arraste para girar · Clique no dente para ver histórico* |
| Arcada 3D cinza matte, fundo escuro | Dentes `oklch(0.55 0 0)`; fundo `surface` / `--background` |
| Dente selecionado/com histórico em azul | `--primary` `oklch(0.63 0.15 250)` + `--primary-glow` no hover |
| Card flutuante "Dente 16 · 1 atendimento" | `tooth-detail-panel.tsx` — card `bg-surface` borda `border` |
| Linha histórico: data, profissional, nota | Join appointments + clinical_notes + tooth_records |
| Chips: Rotação 360° / Clique / Histórico / Status | Mesmos chips, estilo pill `rounded-full border-border` |
| Cursor anel branco no hover | Ring CSS ou mesh outline em R3F |

Assets de referência: `assets/*odontograma*` (screenshots jul/2026).

---

## 3.2 Skill `3d-web-experience` (obrigatória)

Antes de codar o viewer 3D, ler `.agents/skills/3d-web-experience/SKILL.md`.

Checklist derivado da skill:

- [ ] R3F + `useGLTF` + `OrbitControls` + `Suspense` + `useProgress` loader
- [ ] Modelo GLB comprimido (`gltf-transform optimize --compress draco`)
- [ ] `< 5 MB` ideal; `< 100K` triângulos mobile
- [ ] `dynamic(..., { ssr: false })` no Next.js
- [ ] Detecção WebGL → fallback 2D automático
- [ ] `dpr={isMobile ? 1 : 2}` no Canvas
- [ ] Uma `directionalLight` + `ambientLight` (performance)

---

## 4. Modelo de dados

### Migration `023_patient_tooth_records.sql` (reintroduz tabela removida em 021)

```sql
create table patient_tooth_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number smallint not null,
  status text not null default 'healthy',
  faces text[] not null default '{}',
  note text,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint patient_tooth_records_tooth_fdi check (tooth_number between 11 and 48),
  constraint patient_tooth_records_status check (
    status in ('healthy','caries','restored','missing','implant','crown','root_canal','fracture','other')
  ),
  unique (patient_id, tooth_number)
);
```

RLS igual notas clínicas.

### Histórico por dente (query, não tabela nova v1)

Agregar de:

1. `patient_tooth_records` — status atual + nota do dente
2. `patient_clinical_notes` — busca textual por número FDI no `body` (regex `\b(16|46)\b`) **ou** campo futuro `tooth_numbers int[]` (v1.1)
3. `appointments` concluídos do paciente — label procedimento quando nota menciona dente

v1 pragmático: histórico = registros do dente + notas clínicas que mencionam o número FDI.

---

## 5. UI / UX (identidade DR7)

### Container (estilo landing concorrência, tokens DR7)

- Seção com label pill: **"3D INTERATIVO"** (`text-primary`, uppercase, tracking-wider)
- Título: **"Gire, clique e explore."** (`font-display`)
- Subtítulo: *Arraste para girar. Clique no dente para ver o histórico.*
- Viewer em card `rounded-2xl border border-border bg-surface` (não mock de browser — DR7 nativo)
- Chips abaixo do canvas (não interativos v1, só legenda): `Rotação 360°` · `Clique por dente` · `Histórico completo` · `Status por cor`

### 3D (modo principal se spike OK)

- Canvas R3F ~aspect 16:10, min-height 360px mobile / 480px desktop
- `OrbitControls`: rotate on drag, zoom limitado, sem pan
- Mesh por dente com `userData.fdi = 16`
- Hover: outline sutil primary-glow
- Click: dente highlighted primary + painel lateral

### Painel do dente (3D e 2D) — padrão concorrência

Card sobreposto ao canvas (desktop) ou sheet inferior (mobile):

```
┌─────────────────────────┐
│ Dente 16                │
│ 1 atendimento           │  ← contagem em text-primary
├─────────────────────────┤
│ 25/03/2026 · 09:00      │
│ Dr. Ricardo             │
│ Raspagem — dente 16     │
├─────────────────────────┤
│ Status: [select]        │
│ Nota: [textarea]        │
│ [Salvar] [Limpar]       │
└─────────────────────────┘
```

### Fallback 2D

- Duas vistas lado a lado (stack em mobile):
  - **Oclusal** — arcadas vistas de cima, contorno fino, números FDI no gutter central
  - **Raízes** — vista vestibular com raízes (estilo referência minimalista escura)
- Mesmo painel lateral ao clicar
- Sem rotação; scroll horizontal se necessário

### Cores de status

| Status | Cor |
|--------|-----|
| healthy | sem fill (contorno) |
| caries | vermelho suave |
| restored | azul |
| missing | cinza hachurado |
| implant | roxo |
| crown | âmbar |
| root_canal | laranja |
| fracture | vermelho escuro |
| other | zinc |

Selecionado: fill branco ou primary/20 + borda primary.

---

## 6. Arquitetura técnica

```
src/modules/prontuario/odontogram/
  data/
    fdi.ts
    tooth-status.ts
    tooth-record-input.ts
    tooth-history.ts          # agrega histórico por dente
    tooth-history.test.ts
  actions/
    tooth-actions.ts
  viewers/
    odontogram-section.tsx
    odontogram-3d-viewer.tsx   # R3F — skill 3d-web-experience
    odontogram-3d-loader.tsx  # useProgress
    odontogram-2d-fallback.tsx
    tooth-detail-panel.tsx
    webgl-capability.ts       # detecção fallback
  public/models/
    dental-arch.glb           # Draco-compressed
```

**Dependências (spike GO):** `three`, `@react-three/fiber`, `@react-three/drei`  
**Dev tooling:** `@gltf-transform/cli` para compressão do modelo

**Spike go/no-go:**

| Critério | Go 3D |
|----------|-------|
| FPS mobile médio | ≥ 30 |
| Bundle extra | ≤ 500 KB gzip (modelo lazy) |
| Clique preciso por dente | 100% nos 32 dentes |
| Build Next.js | sem erro SSR (dynamic import `ssr: false`) |

Se **no-go** → ship apenas `odontogram-2d-fallback.tsx`.

---

## 7. O que NÃO fazer (v1)

- Plano de tratamento automático com preço
- Dentes decíduos
- Export PDF do odontograma
- Edição de faces 3D por superfície (só status + nota v1)
- Comprar modelo 3D sem licença comercial clara

---

## 8. Critérios de aceite

- [ ] Odontograma visível no prontuário (3D **ou** fallback 2D documentado)
- [ ] Arrastar gira arcada (modo 3D) OU duas vistas 2D navegáveis
- [ ] Clique no dente abre painel com histórico
- [ ] Status persiste em `patient_tooth_records`
- [ ] Tema escuro DR7 consistente
- [ ] Mobile utilizável
- [ ] `npm run test` e `npm run build` passam

**Plano:** `docs/superpowers/plans/2026-07-07-odontograma-3d.md`

---

## 9. Ordem vs Anamnese

| Ordem | Feature | Motivo |
|-------|---------|--------|
| 1 | **Odontograma** (v3.6) | Diferencial visual do prontuário; referência principal do usuário |
| 2 | **Anamnese** (v3.7) | Complementa ficha; menos risco técnico |

Ambas **após deploy beta** (guia §5 item 4), salvo decisão contrária do usuário.
