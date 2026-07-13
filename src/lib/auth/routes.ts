const CLINIC_APP_PREFIXES = [
  "/agenda",
  "/pacientes",
  "/procedimentos",
  "/estoque",
  "/financeiro",
  "/fornecedores",
  "/convenios",
  "/whatsapp",
  "/configuracoes",
  "/ajuda",
  "/feedback",
] as const;

export function isClinicAppPath(pathname: string): boolean {
  return CLINIC_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function defaultAppPathForRole(role: string | null | undefined): string {
  return role === "super_admin" ? "/admin" : "/agenda";
}
