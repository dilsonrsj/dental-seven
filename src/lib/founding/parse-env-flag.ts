/** Parses gate flags; tolerates quoted values from misconfigured env UIs. */
export function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().replace(/^["']+|["']+$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
