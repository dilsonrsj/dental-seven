const SLUG_MAX_LENGTH = 48;

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function buildRefSlugBase(
  fullName: string,
  city: string,
  state: string,
): string {
  const raw = `${fullName} ${city} ${state}`;
  const slug = stripDiacritics(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);

  return slug || "founder";
}

export function withRefSlugSuffix(base: string, suffix: number): string {
  const suffixText = `-${suffix}`;
  const trimmedBase = base.slice(0, Math.max(1, SLUG_MAX_LENGTH - suffixText.length));
  return `${trimmedBase}${suffixText}`;
}

export async function resolveUniqueRefSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await isTaken(base))) {
    return base;
  }

  for (let suffix = 2; suffix <= 99; suffix += 1) {
    const candidate = withRefSlugSuffix(base, suffix);
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error("Não foi possível gerar um link de indicação único.");
}

export function buildFoundingReferralUrl(
  refSlug: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/founding?ref=${encodeURIComponent(refSlug)}`;
}
