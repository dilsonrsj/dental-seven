import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getAuthContext } from "@/lib/auth/context";
import { isBetaGateEnabled } from "@/lib/founding/gate";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect(isBetaGateEnabled() ? "/founding" : "/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link
              href="/admin"
              className="font-display font-semibold tracking-tight text-foreground hover:text-primary"
            >
              SuperAdmin
            </Link>
            <Link
              href="/admin/clinicas"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Clínicas
            </Link>
            <Link
              href="/admin/founding"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Founding
            </Link>
            <Link
              href="/admin/auditoria"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Auditoria
            </Link>
          </nav>
          <SignOutButton className="h-10" />
        </div>
      </header>
      {children}
    </div>
  );
}
