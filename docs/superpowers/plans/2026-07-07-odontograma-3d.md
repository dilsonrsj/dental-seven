# Odontograma 3D Interativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **3d-web-experience** (`.agents/skills/3d-web-experience/SKILL.md`) for todo viewer 3D. Use superpowers:subagent-driven-development or executing-plans.

**Goal:** Odontograma interativo no prontuário — arcada 3D estilo referência concorrência com identidade DR7; rotação + clique → histórico por dente; fallback 2D se WebGL/spike falhar.

**Architecture:** Camada de dados compartilhada; R3F lazy (`ssr: false`) conforme skill; GLB Draco-compressed; `webgl-capability.ts` escolhe 3D vs 2D.

**Spec:** `docs/superpowers/specs/2026-07-07-odontograma-3d-design.md` (v2.0)  
**Guia:** `docs/superpowers/GUIA-MASTER.md` — v3.6  
**Skill:** `.agents/skills/3d-web-experience`

**Tech Stack:** Next.js 15, Supabase, Vitest, R3F, drei, three, gltf-transform (CLI)

---

## Pré-requisito: ler a skill

Antes do Task 0, ler `.agents/skills/3d-web-experience/SKILL.md` — seções **3D Stack Selection**, **Model Pipeline**, **Performance**, **Validation Checks**.

---

## File map

| File | Responsibility |
|------|----------------|
| `supabase/migrations/023_patient_tooth_records.sql` | Tabela + RLS |
| `src/modules/prontuario/odontogram/data/*.ts` | FDI, status, histórico |
| `src/modules/prontuario/odontogram/actions/tooth-actions.ts` | CRUD |
| `src/modules/prontuario/odontogram/viewers/webgl-capability.ts` | Detecção WebGL |
| `src/modules/prontuario/odontogram/viewers/odontogram-3d-loader.tsx` | `useProgress` |
| `src/modules/prontuario/odontogram/viewers/odontogram-3d-viewer.tsx` | Canvas R3F |
| `src/modules/prontuario/odontogram/viewers/odontogram-2d-fallback.tsx` | Dupla vista |
| `src/modules/prontuario/odontogram/viewers/tooth-detail-panel.tsx` | Card histórico |
| `src/modules/prontuario/odontogram/viewers/odontogram-section.tsx` | Orquestrador + copy DR7 |
| `public/models/dental-arch.glb` | Modelo segmentado FDI |
| `docs/superpowers/spikes/2026-07-09-odontograma-3d.md` | Resultado spike |

---

### Task 0: Spike 3D (skill-guided)

- [ ] Instalar deps: `three @react-three/fiber @react-three/drei`
- [ ] Protótipo `odontogram-3d-spike.tsx`:
  - `Canvas` + `Suspense` + `useProgress` loader (skill)
  - `OrbitControls` rotate only; `enableZoom={false}` em mobile
  - `dpr={isMobile ? 1 : 2}`
  - Raycast click em mesh `tooth_XX`
- [ ] Obter GLB teste; comprimir: `gltf-transform optimize input.glb public/models/dental-arch.glb --compress draco`
- [ ] Medir FPS, bundle, precisão clique 32 dentes
- [ ] Documentar go/no-go em `docs/superpowers/spikes/2026-07-09-odontograma-3d.md`

**Go:** FPS mobile ≥ 30, GLB ≤ 5 MB, 32 cliques OK, build Next OK.

### Task 1: Data layer (TDD)

- [ ] `fdi.ts`, `tooth-status.ts`, `tooth-record-input.ts`, `tooth-history.ts` + testes
- [ ] `webgl-capability.test.ts` — mock sem WebGL → false

Run: `npm run test -- src/modules/prontuario/odontogram`

### Task 2: Migration + Supabase

- [ ] `023_patient_tooth_records.sql` + apply MCP

### Task 3: Server actions

- [ ] `tooth-actions.ts` + `listToothHistory(patientId, toothNumber)`

### Task 4: Viewer 3D (se spike GO)

- [ ] `odontogram-3d-viewer.tsx` — meshes nomeados `tooth_11`…`tooth_48`
- [ ] Material neutro cinza; emissão/highlight `--primary` ao selecionar/com status
- [ ] `dynamic(() => import(...), { ssr: false })`
- [ ] Hover ring (cursor visual)

### Task 5: Fallback 2D (sempre)

- [ ] `odontogram-2d-fallback.tsx` — oclusal + raízes
- [ ] Ativado se `!webglSupported` ou env `ODONTOGRAM_FORCE_2D=1`

### Task 6: UI DR7 + painel histórico

- [ ] `odontogram-section.tsx` — label "3D INTERATIVO", título, chips legenda
- [ ] `tooth-detail-panel.tsx` — card estilo concorrência (Dente N · X atendimentos)
- [ ] Mobile: panel vira sheet

### Task 7: Integração prontuário

- [ ] `prontuario/page.tsx` + `prontuario-content.tsx`

### Task 8: Verificação

- [ ] `npm run test` + `npm run build`
- [ ] Smoke manual com screenshots
- [ ] GUIA-MASTER v3.6 ✅

---

## Modelo 3D

1. Blender: arcada simplificada, 32 meshes, export GLB
2. Ou asset licenciado (documentar fonte na spike)
3. **Obrigatório:** Draco + nomes `tooth_{FDI}`

Sem modelo segmentado → ship 2D only (skill: fallback strategy).
