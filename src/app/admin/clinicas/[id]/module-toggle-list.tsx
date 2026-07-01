import { toggleClinicModule } from "@/lib/admin/actions";

type ModuleRow = {
  module_key: string;
  enabled: boolean;
};

type ModuleToggleListProps = {
  clinicId: string;
  modules: ModuleRow[];
};

export function ModuleToggleList({ clinicId, modules }: ModuleToggleListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {modules.map((mod) => (
        <li
          key={mod.module_key}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <span className="font-mono text-sm">{mod.module_key}</span>
          <form
            action={toggleClinicModule.bind(
              null,
              clinicId,
              mod.module_key,
              !mod.enabled,
            )}
          >
            <button
              type="submit"
              className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                mod.enabled
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {mod.enabled ? "Ativo" : "Inativo"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
