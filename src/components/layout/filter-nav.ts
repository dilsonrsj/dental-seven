import type { NavLink } from "./nav-links";

const MODULE_BY_HREF: Record<string, string> = {
  "/agenda": "agenda",
  "/pacientes": "pacientes",
  "/procedimentos": "procedimentos",
  "/estoque": "estoque",
  "/financeiro": "financeiro",
  "/convenios": "convenios",
  "/fornecedores": "fornecedores",
  "/whatsapp": "whatsapp",
};

export function filterNavByModules(
  links: NavLink[],
  enabledModules: string[],
  options?: { hideWhatsapp?: boolean },
): NavLink[] {
  return links.filter((link) => {
    if (options?.hideWhatsapp && link.href === "/whatsapp") {
      return false;
    }
    const moduleKey = MODULE_BY_HREF[link.href];
    if (!moduleKey) return true;
    return enabledModules.includes(moduleKey);
  });
}
