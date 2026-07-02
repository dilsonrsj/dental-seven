type StockAlertBadgeProps = {
  count: number;
  compact?: boolean;
};

export function StockAlertBadge({ count, compact = false }: StockAlertBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 font-display text-[10px] font-semibold text-destructive-foreground ${
        compact ? "h-4" : "ml-auto h-5"
      }`}
      aria-label={`${count} alertas de estoque`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
