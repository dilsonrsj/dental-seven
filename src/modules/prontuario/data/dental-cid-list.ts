export type DentalCidEntry = {
  code: string;
  label: string;
  category: string;
};

export const DENTAL_CID_LIST: DentalCidEntry[] = [
  {
    code: "K00.6",
    label: "Distúrbios da erupção dentária",
    category: "Desenvolvimento e erupção",
  },
  { code: "K01.0", label: "Dentes inclusos", category: "Desenvolvimento e erupção" },
  { code: "K01.1", label: "Dentes impactados", category: "Desenvolvimento e erupção" },
  { code: "K02.1", label: "Cárie da dentina", category: "Cárie e polpa" },
  { code: "K02.9", label: "Cárie, não especificada", category: "Cárie e polpa" },
  { code: "K04.0", label: "Pulpite", category: "Cárie e polpa" },
  { code: "K04.1", label: "Necrose da polpa", category: "Cárie e polpa" },
  { code: "K04.4", label: "Periodontite apical crônica", category: "Cárie e polpa" },
  {
    code: "K04.7",
    label: "Abscesso periapical sem fístula",
    category: "Cárie e polpa",
  },
  { code: "K04.8", label: "Radiculite apical", category: "Cárie e polpa" },
  { code: "K05.0", label: "Gengivite aguda", category: "Gengiva e periodonto" },
  { code: "K05.2", label: "Periodontite aguda", category: "Gengiva e periodonto" },
  { code: "K05.3", label: "Periodontite crônica", category: "Gengiva e periodonto" },
  { code: "K05.5", label: "Outras doenças periodontais", category: "Gengiva e periodonto" },
  { code: "K06.0", label: "Retração gengival", category: "Gengiva e periodonto" },
  {
    code: "K07.6",
    label: "Transtornos da articulação temporomandibular",
    category: "Oclusão e ATM",
  },
  {
    code: "K08.1",
    label:
      "Perda de dentes devida a acidente, extração ou doença periodontal localizada",
    category: "Perda e estruturas",
  },
  { code: "K08.3", label: "Raiz dentária retida", category: "Perda e estruturas" },
  {
    code: "K08.8",
    label:
      "Outros transtornos especificados dos dentes e estruturas de sustentação",
    category: "Perda e estruturas",
  },
  {
    code: "K09.0",
    label: "Cistos originados por desenvolvimento odontológico",
    category: "Cistos",
  },
  { code: "K10.2", label: "Doenças inflamatórias dos maxilares", category: "Maxilares" },
  { code: "K10.3", label: "Alveolite dos maxilares", category: "Maxilares" },
  { code: "K11.2", label: "Sialadenite", category: "Glândulas salivares" },
  { code: "K11.5", label: "Sialolitíase", category: "Glândulas salivares" },
  { code: "K12.0", label: "Aftas recorrentes", category: "Mucosa e boca" },
  { code: "K12.1", label: "Outras formas de estomatite", category: "Mucosa e boca" },
  { code: "K12.2", label: "Celulite e abscesso de boca", category: "Mucosa e boca" },
  { code: "K13.0", label: "Doenças dos lábios", category: "Mucosa e boca" },
  {
    code: "K13.7",
    label: "Outras lesões e alterações especificadas da mucosa oral",
    category: "Mucosa e boca",
  },
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

export function groupDentalCidsByCategory(): {
  category: string;
  entries: DentalCidEntry[];
}[] {
  const groups = new Map<string, DentalCidEntry[]>();
  for (const entry of DENTAL_CID_LIST) {
    const list = groups.get(entry.category) ?? [];
    list.push(entry);
    groups.set(entry.category, list);
  }
  return [...groups.entries()].map(([category, entries]) => ({ category, entries }));
}
