"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_LINKS } from "./nav-links";
import { filterNavByModules } from "./filter-nav";
import { useClinicSession } from "@/contexts/clinic-session-context";

export function BottomNav() {
  const pathname = usePathname();
  const { enabledModules } = useClinicSession();
  const links = filterNavByModules(APP_NAV_LINKS, enabledModules);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
