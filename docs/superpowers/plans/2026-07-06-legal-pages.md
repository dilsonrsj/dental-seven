# Plano — Páginas legais (Termos + Privacidade)

**Spec:** `docs/superpowers/specs/2026-07-06-legal-pages-design.md`  
**Status:** Concluído em 2026-07-06

## Entregas

1. Migration `018_profiles_terms_accepted.sql` — coluna `terms_accepted_at` em `profiles`
2. Markdown em `src/content/legal/` (termos + privacidade, vigência 6/jul/2026)
3. Renderer leve `src/lib/legal/render-markdown.tsx` (sem nova dependência)
4. Páginas públicas `/termos` e `/privacidade`
5. `PUBLIC_PATHS` no middleware
6. Checkbox obrigatório no cadastro + gravação de `terms_accepted_at`
7. Links em `/entrar` e `/cadastro`

## Verificação

```bash
npm run test
npm run build
```

## Backlog (fora do escopo v1)

- Checkbox no fluxo de convite de dentista
- Links em Configurações → Conta
- Revisão jurídica profissional antes de marketing massivo
