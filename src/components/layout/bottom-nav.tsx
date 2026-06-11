"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_LINKS } from "./nav-links";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface lg:hidden"
    >
      <div className="flex items-stretch justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {APP_NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
