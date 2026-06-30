"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type DemoLogoutButtonProps = {
  className?: string;
  /** Ícone apenas — útil no header mobile. */
  compact?: boolean;
};

export function DemoLogoutButton({
  className = "",
  compact = false,
}: DemoLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/demo", { method: "DELETE" });
      router.push("/entrar");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={handleLogout}
      disabled={loading}
      className={`shrink-0 gap-2 normal-case tracking-normal ${className}`}
      aria-label="Sair da demonstração"
      title="Sair da demonstração"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {!compact ? (
        <span>{loading ? "Saindo…" : "Sair"}</span>
      ) : (
        <span className="hidden sm:inline">{loading ? "Saindo…" : "Sair"}</span>
      )}
    </Button>
  );
}
