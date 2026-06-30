"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { APP_NAV_LINKS } from "./nav-links";
import { DemoLogoutButton } from "./demo-logout-button";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {APP_NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <footer className="flex flex-col items-stretch gap-3 border-t border-border p-4">
        <DemoLogoutButton className="w-full justify-center" />
        <div className="flex flex-col items-center gap-2">
          <Dr7Logo height={32} />
          <span className="text-xs text-muted-foreground">DR7 Performance</span>
        </div>
      </footer>
    </aside>
  );
}
