import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function SignOutButton({
  className = "",
  compact = false,
}: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="outline"
        size="md"
        className={`shrink-0 gap-2 normal-case tracking-normal ${className}`}
        aria-label="Sair da conta"
        title="Sair"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        {!compact ? (
          <span>Sair</span>
        ) : (
          <span className="hidden sm:inline">Sair</span>
        )}
      </Button>
    </form>
  );
}
