# Atestado CID — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar seleção de CID-10 odontológico no atestado, com autorização do paciente, dropdown curado e redação CFO no PDF.

**Architecture:** Lista estática `dental-cid-list.ts`; estender `ClinicalDocumentFormInput` e `AtestadoPayload`; validação em `clinical-document-input.ts`; texto condicional em `buildAtestadoLines`; UI com checkbox + `<select>` nativo. Sem migration.

**Tech Stack:** Next.js 15, React, Vitest, pdf-lib (existente).

**Spec:** `docs/superpowers/specs/2026-07-03-atestado-cid-design.md`

**Branch:** `feat/v2` apenas — **não mergear em `main`**.

---

## File map

| Path | Responsabilidade |
|------|------------------|
| `src/modules/prontuario/data/dental-cid-list.ts` | Catálogo CID K00–K14 + `getDentalCidByCode` |
| `src/modules/prontuario/data/dental-cid-list.test.ts` | Testes do catálogo |
| `src/modules/prontuario/templates/types.ts` | `AtestadoPayload` com `cid` |
| `src/modules/prontuario/templates/atestado.ts` | Texto PDF com/sem CID |
| `src/modules/prontuario/templates/atestado.test.ts` | Testes das linhas do atestado |
| `src/modules/prontuario/clinical-document-input.ts` | Validação + mapeamento |
| `src/modules/prontuario/clinical-document-input.test.ts` | Testes de input/payload |
| `src/modules/prontuario/clinical-document-form.tsx` | Checkbox + select na UI |

---

## Tasks

- [x] Task 1: Catálogo `dental-cid-list.ts` + testes
- [x] Task 2: Tipos + `buildAtestadoLines` + testes
- [x] Task 3: Validação e payload em `clinical-document-input.ts` + testes
- [x] Task 4: UI `clinical-document-form.tsx`
- [x] Task 5: Verificação final (`npm run test`, `npm run build`) + aceite na spec

---

## Task 1: Catálogo CID

**Files:**
- Create: `src/modules/prontuario/data/dental-cid-list.ts`
- Create: `src/modules/prontuario/data/dental-cid-list.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/prontuario/data/dental-cid-list.test.ts
import { describe, expect, it } from "vitest";
import {
  DENTAL_CID_LIST,
  formatDentalCidOption,
  getDentalCidByCode,
} from "./dental-cid-list";

describe("dental-cid-list", () => {
  it("retorna entrada por código", () => {
    const entry = getDentalCidByCode("K04.0");
    expect(entry).toEqual({
      code: "K04.0",
      label: "Pulpite",
      category: "Cárie e polpa",
    });
  });

  it("retorna undefined para código inexistente", () => {
    expect(getDentalCidByCode("Z99.9")).toBeUndefined();
  });

  it("formata opção para o select", () => {
    expect(formatDentalCidOption({ code: "K04.0", label: "Pulpite", category: "x" })).toBe(
      "K04.0 — Pulpite",
    );
  });

  it("tem códigos únicos", () => {
    const codes = DENTAL_CID_LIST.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/modules/prontuario/data/dental-cid-list.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// src/modules/prontuario/data/dental-cid-list.ts
export type DentalCidEntry = {
  code: string;
  label: string;
  category: string;
};

export const DENTAL_CID_LIST: DentalCidEntry[] = [
  { code: "K00.6", label: "Distúrbios da erupção dentária", category: "Desenvolvimento e erupção" },
  { code: "K01.0", label: "Dentes inclusos", category: "Desenvolvimento e erupção" },
  { code: "K01.1", label: "Dentes impactados", category: "Desenvolvimento e erupção" },
  { code: "K02.1", label: "Cárie da dentina", category: "Cárie e polpa" },
  { code: "K02.9", label: "Cárie, não especificada", category: "Cárie e polpa" },
  { code: "K04.0", label: "Pulpite", category: "Cárie e polpa" },
  { code: "K04.1", label: "Necrose da polpa", category: "Cárie e polpa" },
  { code: "K04.4", label: "Periodontite apical crônica", category: "Cárie e polpa" },
  { code: "K04.7", label: "Abscesso periapical sem fístula", category: "Cárie e polpa" },
  { code: "K04.8", label: "Radiculite apical", category: "Cárie e polpa" },
  { code: "K05.0", label: "Gengivite aguda", category: "Gengiva e periodonto" },
  { code: "K05.2", label: "Periodontite aguda", category: "Gengiva e periodonto" },
  { code: "K05.3", label: "Periodontite crônica", category: "Gengiva e periodonto" },
  { code: "K05.5", label: "Outras doenças periodontais", category: "Gengiva e periodonto" },
  { code: "K06.0", label: "Retração gengival", category: "Gengiva e periodonto" },
  { code: "K07.6", label: "Transtornos da articulação temporomandibular", category: "Oclusão e ATM" },
  { code: "K08.1", label: "Perda de dentes devida a acidente, extração ou doença periodontal localizada", category: "Perda e estruturas" },
  { code: "K08.3", label: "Raiz dentária retida", category: "Perda e estruturas" },
  { code: "K08.8", label: "Outros transtornos especificados dos dentes e estruturas de sustentação", category: "Perda e estruturas" },
  { code: "K09.0", label: "Cistos originados por desenvolvimento odontológico", category: "Cistos" },
  { code: "K10.2", label: "Doenças inflamatórias dos maxilares", category: "Maxilares" },
  { code: "K10.3", label: "Alveolite dos maxilares", category: "Maxilares" },
  { code: "K11.2", label: "Sialadenite", category: "Glândulas salivares" },
  { code: "K11.5", label: "Sialolitíase", category: "Glândulas salivares" },
  { code: "K12.0", label: "Aftas recorrentes", category: "Mucosa e boca" },
  { code: "K12.1", label: "Outras formas de estomatite", category: "Mucosa e boca" },
  { code: "K12.2", label: "Celulite e abscesso de boca", category: "Mucosa e boca" },
  { code: "K13.0", label: "Doenças dos lábios", category: "Mucosa e boca" },
  { code: "K13.7", label: "Outras lesões e alterações especificadas da mucosa oral", category: "Mucosa e boca" },
  { code: "K14.0", label: "Glossite", category: "Língua" },
  { code: "K14.6", label: "Glosodinia", category: "Língua" },
];

const byCode = new Map(DENTAL_CID_LIST.map((entry) => [entry.code, entry]));

export function getDentalCidByCode(code: string): DentalCidEntry | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function formatDentalCidOption(entry: DentalCidEntry): string {
  return `${entry.code} — ${entry.label}`;
}

export function groupDentalCidsByCategory(): { category: string; entries: DentalCidEntry[] }[] {
  const groups = new Map<string, DentalCidEntry[]>();
  for (const entry of DENTAL_CID_LIST) {
    const list = groups.get(entry.category) ?? [];
    list.push(entry);
    groups.set(entry.category, list);
  }
  return [...groups.entries()].map(([category, entries]) => ({ category, entries }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/modules/prontuario/data/dental-cid-list.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/prontuario/data/dental-cid-list.ts src/modules/prontuario/data/dental-cid-list.test.ts
git commit -m "feat(prontuario): catálogo CID odontológico K00-K14"
```

---

## Task 2: Texto do PDF

**Files:**
- Modify: `src/modules/prontuario/templates/types.ts`
- Modify: `src/modules/prontuario/templates/atestado.ts`
- Create: `src/modules/prontuario/templates/atestado.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/prontuario/templates/atestado.test.ts
import { describe, expect, it } from "vitest";
import { buildAtestadoLines } from "./atestado";

const base = {
  clinicName: "Clínica",
  patientName: "Maria",
  dentistName: "Dr. João",
  dentistCro: null,
  dentistSpecialty: null,
  issuedAt: new Date("2026-07-03"),
  template: "atestado" as const,
  daysOff: 2,
  reason: null,
  cidPatientAuthorized: false,
  cid: null,
};

describe("buildAtestadoLines", () => {
  it("mantém texto legado sem autorização de CID", () => {
    const lines = buildAtestadoLines(base);
    expect(lines.join("\n")).toContain("Atesto, para os devidos fins");
    expect(lines.join("\n")).not.toContain("CID-11");
  });

  it("usa redação CFO com CID autorizado", () => {
    const lines = buildAtestadoLines({
      ...base,
      cidPatientAuthorized: true,
      cid: { code: "K04.0", label: "Pulpite" },
    });
    const text = lines.join("\n");
    expect(text).toContain("a pedido do interessado");
    expect(text).toContain("CID-11 nº K04.0 — Pulpite");
  });

  it("inclui motivo opcional após o corpo principal", () => {
    const lines = buildAtestadoLines({ ...base, reason: "Extração" });
    expect(lines.join("\n")).toContain("Motivo: Extração");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/modules/prontuario/templates/atestado.test.ts`
Expected: FAIL — type errors or missing fields

- [ ] **Step 3: Update types**

Em `src/modules/prontuario/templates/types.ts`, alterar `AtestadoPayload`:

```typescript
export type AtestadoPayload = ClinicalDocumentContext & {
  template: "atestado";
  daysOff: number;
  reason?: string | null;
  cidPatientAuthorized: boolean;
  cid?: { code: string; label: string } | null;
};
```

- [ ] **Step 4: Update buildAtestadoLines**

```typescript
// src/modules/prontuario/templates/atestado.ts
export function buildAtestadoLines(payload: AtestadoPayload): string[] {
  const daysLabel = payload.daysOff === 1 ? "1 dia" : `${payload.daysOff} dias`;
  const hasCid = payload.cidPatientAuthorized && payload.cid;

  const intro = hasCid
    ? `Atesto, a pedido do interessado, inclusive com menção de CID por este(a) solicitada, que o(a) paciente acima necessita de afastamento de suas atividades por ${daysLabel}, em virtude de CID-11 nº ${payload.cid!.code} — ${payload.cid!.label}.`
    : `Atesto, para os devidos fins, que o(a) paciente acima necessita de afastamento de suas atividades por ${daysLabel}.`;

  const lines = [`Paciente: ${payload.patientName}`, "", intro];

  if (payload.reason?.trim()) {
    lines.push("", `Motivo: ${payload.reason.trim()}`);
  }

  return lines;
}
```

- [ ] **Step 5: Fix callers that construct AtestadoPayload**

Atualizar `generate-clinical-pdf.test.ts` — adicionar `cidPatientAuthorized: false, cid: null` no payload de atestado existente.

- [ ] **Step 6: Run tests**

Run: `npm run test -- src/modules/prontuario/templates/atestado.test.ts src/modules/prontuario/generate-clinical-pdf.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/modules/prontuario/templates/types.ts src/modules/prontuario/templates/atestado.ts src/modules/prontuario/templates/atestado.test.ts src/modules/prontuario/generate-clinical-pdf.test.ts
git commit -m "feat(prontuario): texto de atestado com CID autorizado"
```

---

## Task 3: Validação e payload

**Files:**
- Modify: `src/modules/prontuario/clinical-document-input.ts`
- Modify: `src/modules/prontuario/clinical-document-input.test.ts`

- [ ] **Step 1: Write failing tests**

Adicionar em `clinical-document-input.test.ts`:

```typescript
import { getDentalCidByCode } from "./data/dental-cid-list";

// ... dentro do describe

it("rejeita autorização de CID sem código selecionado", () => {
  expect(() =>
    validateClinicalDocumentInput({
      template: "atestado",
      daysOff: 1,
      cidPatientAuthorized: true,
    }),
  ).toThrow(/selecione o cid/i);
});

it("monta payload com CID quando autorizado", () => {
  const payload = toClinicalPdfPayload(
    {
      template: "atestado",
      daysOff: 3,
      cidPatientAuthorized: true,
      cidCode: "K04.0",
    },
    { clinicName: "C", patientName: "Ana", dentistName: "Dr." },
  );

  expect(payload.template).toBe("atestado");
  if (payload.template === "atestado") {
    expect(payload.cidPatientAuthorized).toBe(true);
    expect(payload.cid).toEqual({ code: "K04.0", label: "Pulpite" });
  }
});

it("ignora CID quando autorização não marcada", () => {
  const payload = toClinicalPdfPayload(
    {
      template: "atestado",
      daysOff: 1,
      cidPatientAuthorized: false,
      cidCode: "K04.0",
    },
    { clinicName: "C", patientName: "Ana", dentistName: "Dr." },
  );

  if (payload.template === "atestado") {
    expect(payload.cidPatientAuthorized).toBe(false);
    expect(payload.cid).toBeNull();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/modules/prontuario/clinical-document-input.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement validation and mapping**

```typescript
// clinical-document-input.ts — adicionar imports
import { getDentalCidByCode } from "./data/dental-cid-list";

// ClinicalDocumentFormInput
export type ClinicalDocumentFormInput = {
  template: ClinicalDocumentTemplate;
  medications?: string;
  daysOff?: number;
  reason?: string;
  exams?: string;
  customTitle?: string;
  cidPatientAuthorized?: boolean;
  cidCode?: string;
};

// validateClinicalDocumentInput — case "atestado"
case "atestado": {
  const days = Number(input.daysOff);
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    throw new Error("Informe os dias de afastamento (1 a 365).");
  }
  if (input.cidPatientAuthorized) {
    const code = input.cidCode?.trim();
    if (!code || !getDentalCidByCode(code)) {
      throw new Error("Selecione o CID autorizado pelo paciente.");
    }
  }
  return;
}

// toClinicalPdfPayload — case "atestado"
case "atestado": {
  const authorized = Boolean(input.cidPatientAuthorized);
  const cidEntry = authorized ? getDentalCidByCode(input.cidCode ?? "") : undefined;
  return {
    ...base,
    template: "atestado",
    daysOff: Number(input.daysOff),
    reason: input.reason?.trim() || null,
    cidPatientAuthorized: authorized,
    cid: cidEntry ? { code: cidEntry.code, label: cidEntry.label } : null,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/modules/prontuario/clinical-document-input.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/prontuario/clinical-document-input.ts src/modules/prontuario/clinical-document-input.test.ts
git commit -m "feat(prontuario): validação e payload de CID no atestado"
```

---

## Task 4: UI do formulário

**Files:**
- Modify: `src/modules/prontuario/clinical-document-form.tsx`

- [ ] **Step 1: Add state and wire buildInput**

```typescript
import {
  DENTAL_CID_LIST,
  formatDentalCidOption,
  groupDentalCidsByCategory,
} from "./data/dental-cid-list";

// state
const [cidPatientAuthorized, setCidPatientAuthorized] = useState(false);
const [cidCode, setCidCode] = useState("");

// buildInput()
return {
  template,
  customTitle,
  medications,
  daysOff: Number(daysOff),
  reason,
  exams,
  cidPatientAuthorized,
  cidCode: cidPatientAuthorized ? cidCode : undefined,
};
```

- [ ] **Step 2: Add checkbox + select after dias de afastamento**

```tsx
<label className="flex items-start gap-2">
  <input
    type="checkbox"
    checked={cidPatientAuthorized}
    onChange={(event) => {
      setCidPatientAuthorized(event.target.checked);
      if (!event.target.checked) setCidCode("");
    }}
    disabled={!canWrite || isBusy}
    className="mt-1"
  />
  <span className="text-sm text-muted-foreground">
    Paciente autoriza inclusão do CID no atestado
  </span>
</label>
<p className="text-xs text-muted-foreground">
  Conforme orientação do CFO, o CID só deve constar no atestado com autorização expressa do paciente.
</p>

{cidPatientAuthorized && (
  <label className="block space-y-1.5">
    <span className="text-sm text-muted-foreground">CID-10</span>
    <select
      value={cidCode}
      onChange={(event) => setCidCode(event.target.value)}
      disabled={!canWrite || isBusy}
      required
      className="flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Selecione o CID</option>
      {groupDentalCidsByCategory().map((group) => (
        <optgroup key={group.category} label={group.category}>
          {group.entries.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {formatDentalCidOption(entry)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  </label>
)}
```

Nota: remover import não usado de `DENTAL_CID_LIST` se só `groupDentalCidsByCategory` for necessário.

- [ ] **Step 3: Manual smoke**

1. `npm run dev`
2. Abrir prontuário de um paciente
3. Gerar atestado sem checkbox → PDF sem CID
4. Marcar checkbox, selecionar K04.0, preview → PDF com redação CFO

- [ ] **Step 4: Commit**

```bash
git add src/modules/prontuario/clinical-document-form.tsx
git commit -m "feat(prontuario): UI de autorização e seleção de CID no atestado"
```

---

## Task 5: Verificação final

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: all PASS

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success

- [ ] **Step 3: Mark spec acceptance criteria**

Atualizar checkboxes em `docs/superpowers/specs/2026-07-03-atestado-cid-design.md` §11

- [ ] **Step 4: Commit docs**

```bash
git add docs/superpowers/specs/2026-07-03-atestado-cid-design.md docs/superpowers/plans/2026-07-03-atestado-cid.md
git commit -m "docs: spec e plano atestado CID concluídos"
```

---

## Self-review (spec coverage)

| Spec § | Task |
|--------|------|
| §3 Decisões 1–7 | Tasks 1–4 |
| §5 UX formulário | Task 4 |
| §6 Texto PDF | Task 2 |
| §7 Modelo dados | Tasks 2–3 |
| §8 Catálogo | Task 1 |
| §10 Testes | Tasks 1–3 |
| §11 Aceite | Task 5 |
