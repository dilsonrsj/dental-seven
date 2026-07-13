# Dental Seven — Logo da Clínica Design Spec

**Versão:** 1.0  
**Data:** 2026-07-07  
**Status:** Aprovada — implementada em 2026-07-07  
**Branch:** `feat/v2`  
**Guia:** `docs/superpowers/GUIA-MASTER.md` §5 item 3

---

## 1. Objetivo

Permitir que cada clínica faça **upload da própria logo** e a veja no **header do app** e no **topo dos PDFs clínicos**, reforçando identidade visual na beta sem customizar favicon por tenant.

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Coluna `clinics.logo_storage_path` (nullable) — migration `019_clinic_logo.sql` |
| 2 | Bucket Supabase `clinic-assets` (ou existente equivalente) — path `{clinic_id}/logo.{ext}` |
| 3 | Formatos: **PNG e JPG**; máx **2 MB** |
| 4 | Upload em `/configuracoes` — só `clinic_admin` |
| 5 | Header: logo da clínica **à esquerda do nome**; se vazio, manter ícone Dental Seven (comportamento atual) |
| 6 | PDF: logo no topo se existir; senão só nome da clínica em texto (como hoje) |
| 7 | Remover logo = set `logo_storage_path` null + delete arquivo no storage |
| 8 | **Sem** favicon por tenant na v1 |
| 9 | Grandfather: clínicas sem logo continuam iguais |

---

## 3. UI

### Configurações

- Card **"Logo da clínica"** abaixo de contatos ou na seção Conta
- Preview da imagem atual (ou placeholder)
- Input file + botão "Enviar" / "Remover logo"
- Mensagem de erro clara (tamanho, formato)

### Header (`app-header.tsx`)

- Se `clinic.logo_url` (signed ou public path): `<Image>` com alt = nome da clínica, max height ~36px
- Senão: `DentalSevenLogo` mark (atual)

### PDF (`generate-clinical-pdf.ts`)

- Se logo disponível no contexto do PDF: desenhar no topo centralizado ou à esquerda (max ~120px largura)
- Fallback: título texto da clínica

---

## 4. Técnico

| Peça | Arquivo previsto |
|------|------------------|
| Migration | `supabase/migrations/019_clinic_logo.sql` |
| Actions | `src/modules/configuracoes/clinic-logo-actions.ts` |
| Form | `src/modules/configuracoes/clinic-logo-form.tsx` |
| Página config | `src/app/(app)/configuracoes/page.tsx` |
| Session/context | expor `logo_storage_path` ou URL assinada em `clinic` |
| Header | `src/components/layout/app-header.tsx` |
| PDF | `src/modules/prontuario/generate-clinical-pdf.ts` + footer context |

**RLS storage:** políticas por `clinic_id` — apenas usuários da clínica leem/escrevem seu prefixo.

---

## 5. Critérios de aceite

- [x] Admin faz upload PNG/JPG ≤ 2 MB
- [x] Logo aparece no header após refresh
- [x] Logo aparece em PDF de receita/atestado quando configurada
- [x] Remover logo restaura padrão Dental Seven
- [x] `npm run test` e `npm run build` passam

**Plano:** `docs/superpowers/plans/2026-07-06-clinic-logo.md` (criar após aprovação)

---

## 6. Fora do escopo v1

- Crop/resize avançado in-app
- SVG animado
- Logo em e-mails transacionais
- Favicon por clínica
