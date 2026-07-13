"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_LINKS } from "./nav-links";
import { StockAlertBadge } from "./stock-alert-badge";

type BottomNavProps = {
  /** Hrefs permitidos (calculados no servidor para evitar divergência de módulos). */
  enabledHrefs: string[];
  stockAlertCount?: number;
};

export function BottomNav({ enabledHrefs, stockAlertCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const hrefSet = new Set(enabledHrefs);
  const links = APP_NAV_LINKS.filter((link) => hrefSet.has(link.href));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <div className="flex px-1 pt-1">
        {links.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const displayLabel = shortLabel ?? label;

          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 px-0.5 py-1.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" aria-hidden />
                {href === "/estoque" && stockAlertCount > 0 && (
                  <span className="absolute -right-2 -top-1">
                    <StockAlertBadge count={stockAlertCount} compact />
                  </span>
                )}
              </span>
              {active ? (
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">
                  {displayLabel}
                </span>
              ) : (
                <span className="h-[9px]" aria-hidden />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
