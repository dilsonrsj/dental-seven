import type { NavLink } from "./nav-links";

const MODULE_BY_HREF: Record<string, string> = {
  "/agenda": "agenda",
  "/pacientes": "pacientes",
  "/procedimentos": "procedimentos",
  "/estoque": "estoque",
  "/whatsapp": "whatsapp",
};

export function filterNavByModules(
  links: NavLink[],
  enabledModules: string[],
): NavLink[] {
  return links.filter((link) => {
    const moduleKey = MODULE_BY_HREF[link.href];
    if (!moduleKey) return true;
    return enabledModules.includes(moduleKey);
  });
}
