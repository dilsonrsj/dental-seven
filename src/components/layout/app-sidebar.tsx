"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { APP_NAV_LINKS } from "./nav-links";
import { filterNavByModules } from "./filter-nav";
import { useClinicSession } from "@/contexts/clinic-session-context";
import { SignOutButton } from "./sign-out-button";

export function AppSidebar() {
  const pathname = usePathname();
  const { enabledModules } = useClinicSession();
  const links = filterNavByModules(APP_NAV_LINKS, enabledModules);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="border-b border-border p-4">
        <DentalSevenLogo
          variant="full"
          surface="transparent"
          height={72}
          href="/agenda"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map(({ href, label, icon: Icon }) => {
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
        <SignOutButton className="w-full justify-center" />
        <div className="flex flex-col items-center gap-2">
          <Dr7Logo height={32} />
          <span className="text-xs text-muted-foreground">DR7 Performance</span>
        </div>
      </footer>
    </aside>
  );
}
