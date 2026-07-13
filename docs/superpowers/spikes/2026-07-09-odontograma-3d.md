# Spike Odontograma 3D — 2026-07-09

**Resultado:** GO (protótipo procedural → GLB placeholder integrado)

## Abordagem

- Arcada **procedural** com 32 meshes (`boxGeometry`) posicionados em elipse superior/inferior
- R3F + drei `OrbitControls` + `Suspense` + loader `useProgress`
- `dynamic(..., { ssr: false })` no Next.js 15
- Fallback 2D automático se WebGL indisponível

## Modelo GLB (2026-07-10)

- **Meshy AI descartado:** arquivo único 57 MB / 1 mesh — incompatível com clique por dente FDI.
- **Gerador clínico:** `npm run odontogram:generate-glb` → `public/models/dental-arch.glb` (~190 KB)
  - 32 meshes `tooth_XX` + `gum_upper` / `gum_lower`
  - Vista frontal (referência Ayra), cinza matte, segmentado para interatividade
- Modelo fotorealista externo ainda pode substituir o GLB mantendo convenção `tooth_XX`

## Bug conhecido — fallback 2D após carregar 3D (P0 UX) — **CORRIGIDO 2026-07-10**

**Sintoma:** o 3D abria, mas após ~20s caía para 2D.

**Causa:** efeito do timeout reiniciava `loadedRef` depois do filho reportar sucesso; callback `onLoadError` instável rearmava o timer a cada render.

**Correção:** refs estáveis para callbacks, cancelamento do timer no sucesso, `key={modelUrl}` no scene, guard `glbLoadedRef` no section.

## Ambiente dev (nota)

- Cache `.next` corrompido pode causar 500 em `localhost:3000`; reiniciar com `.next` limpo
- Se porta 3000 ocupada, Next sobe em **3001**

## Próximo upgrade (pós-MVP beta)

- Substituir placeholder por `dental-arch.glb` realista segmentado (Draco)
- `gltf-transform optimize` para < 5 MB

## Identidade DR7

- Fundo `#0d0d0f`, dentes cinza `#7a7a7a`
- Seleção/hover emissivo `#4490E2` (primary)
- Copy AHA: *Gire, clique e explore.*
