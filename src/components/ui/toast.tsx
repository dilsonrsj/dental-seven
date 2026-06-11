export type ToastType = "success" | "error";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastHandler = (message: string, type: ToastType) => void;

let toastHandler: ToastHandler | null = null;

export function registerToastHandler(handler: ToastHandler | null) {
  toastHandler = handler;
}

export const toast = {
  success(message: string) {
    toastHandler?.(message, "success");
  },
  error(message: string) {
    toastHandler?.(message, "error");
  },
};

type ToastViewProps = {
  item: ToastItem;
  onDismiss: (id: string) => void;
};

export function ToastView({ item, onDismiss }: ToastViewProps) {
  const styles =
    item.type === "success"
      ? "border-primary/30 text-primary"
      : "border-destructive/30 text-destructive";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex min-w-[280px] max-w-sm items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 shadow-lg animate-fade-in-up ${styles}`}
    >
      <p className="text-sm font-medium">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Fechar notificação"
      >
        Fechar
      </button>
    </div>
  );
}
