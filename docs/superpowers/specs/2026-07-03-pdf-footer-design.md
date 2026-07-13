# Dental Seven — Rodapé PDF Documentos Clínicos Design Spec

**Versão:** 1.0  
**Data:** 2026-07-03  
**Status:** Implementado — aceite 2026-07-03  
**Branch:** `feat/v2`

---

## 1. Objetivo

Redesenhar o rodapé de receitas, atestados e guias: contatos da clínica no canto inferior esquerdo com ícones; assinatura centralizada acima de nome/CRO/especialidade; alinhamento horizontal por linha.

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Contatos = dados da **clínica** (`clinics.contact_*`) |
| 2 | Omitir linhas de contato vazias no PDF |
| 3 | Bloco de contatos **ancorado inferior esquerdo** |
| 4 | Assinatura **acima** do nome (~8px), centralizada |
| 5 | Alinhamento: WhatsApp ═ nome; Instagram ═ CRO; E-mail ═ especialidade; endereço só à esquerda (base) |
| 6 | Ícones WhatsApp/Instagram = PNGs fornecidos pelo cliente |
| 7 | E-mail/endereço = ícones vetoriais monocromáticos |
| 8 | Backfill fictício Clínica Smoke Test na migration |

---

## 3. Layout

```
[assinatura — centro]
📱 WhatsApp     Dra. Smoke Test    ← mesma linha y
📷 Instagram    CRO: 123456
✉  Email        Ortodontia
📍 Endereço     (base esquerda, y = 45)
```

---

## 4. Migration

`016_clinic_contact_footer.sql` — colunas `contact_whatsapp`, `contact_instagram`, `contact_email`, `contact_address`.

---

## 5. UI

Card *Contatos no rodapé dos documentos* em `/configuracoes` (`clinic_admin`).

---

## 6. Critérios de aceite

- [x] Rodapé aplicado a receita, atestado e guia
- [x] Contatos inferior esquerdo com ícones
- [x] Assinatura centralizada acima do nome
- [x] Nome alinhado com WhatsApp
- [x] Configuração em /configuracoes
- [x] Smoke Test backfill na migration
- [x] `npm run test` e `npm run build`

**Plano:** `docs/superpowers/plans/2026-07-03-pdf-footer.md`
