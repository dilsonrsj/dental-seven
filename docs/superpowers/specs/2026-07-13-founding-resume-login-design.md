# Dental Seven — Retomada Founding → Entrar (design)

**Data:** 2026-07-13  
**Status:** Aprovado (usuário)  
**Branch:** `main` (beta produção)  
**Relacionados:** gate `DENTAL_SEVEN_BETA_GATE`, `beta_founders`, `/founding`

---

## 1. Objetivo

Porta única da beta em **`/founding`**. Quem **já criou a clínica** valida **e-mail + WhatsApp** do Founding, recebe o cookie e segue para **`/entrar`**. SuperAdmin usa o **mesmo fluxo** (registro em `beta_founders`).

---

## 2. Decisões

| # | Decisão |
|---|---------|
| 1 | Anônimo sem cookie → sempre `/founding` (inclui `/`, `/entrar`, `/cadastro`, `/admin`, app) |
| 2 | Botão **“Já criei minha clínica”** = e-mail + WhatsApp → cookie → `/entrar` |
| 3 | Formulário completo Founding continua para **novos** (→ cookie → `/cadastro`) |
| 4 | SuperAdmin: **mesmo botão**; seed `superadmin-smoke@dr7.app` em `beta_founders` |
| 5 | Identidade: e-mail + WhatsApp (reusa `assertFoundingResumeAllowed`) |
| 6 | Não exigir `clinic_id` no resume (SuperAdmin não tem clínica) |

---

## 3. Fluxos

```
[Visitante] → /founding
  ├─ Novo → form completo → cookie → /cadastro
  └─ “Já criei minha clínica” → e-mail + WhatsApp → cookie → /entrar
       └─ super_admin → /admin após Auth
```

---

## 4. Gate (middleware)

Com `DENTAL_SEVEN_BETA_GATE=true`:

- Sem user e path `/entrar` ou `/cadastro` sem cookie founding válido → `/founding`
- Sem user e path protegido (ex. `/admin`, `/agenda`) → `/founding`
- `/` → `/founding`

Com cookie válido: `/entrar` e `/cadastro` liberados.

---

## 5. UI `/founding`

- Link/botão secundário: **“Já criei minha clínica — quero entrar”**
- Expande formulário curto: e-mail, WhatsApp, CTA
- Erro genérico se e-mail ausente ou WhatsApp não bate
- Sucesso: `redirect('/entrar')` (client) após action OK

---

## 6. Server action

`resumeFoundingForLogin({ email, whatsapp })`:

1. Normaliza e-mail / WhatsApp  
2. Busca `beta_founders` por e-mail  
3. `assertFoundingResumeAllowed`  
4. `setFoundingCookie(access_token)`  
5. `{ ok: true }` ou `{ ok: false, error }`

---

## 7. Seed SuperAdmin

Inserir (idempotente) em `beta_founders`:

- email: `superadmin-smoke@dr7.app`
- whatsapp: o da DR7 operacional documentado no seed (`79998364822` — WhatsApp do fallback `/founding`)
- demais campos mínimos “DR7 Performance / SuperAdmin”
- terms/marketing true

Documentar no GUIA-MASTER §2.

---

## 8. Fora de escopo

- Magic link / OTP  
- Rate limit avançado  
- Alterar signup ou Asaas  

---

## 9. Aceite

- [ ] Sem cookie, `/entrar` e `/admin` → `/founding`
- [ ] Resume e-mail+WhatsApp corretos → cookie → `/entrar` funciona
- [ ] WhatsApp errado → erro, sem cookie
- [ ] SuperAdmin resume → login → `/admin`
