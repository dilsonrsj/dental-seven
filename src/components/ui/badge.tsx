import { HTMLAttributes } from "react";

export type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary/30 px-2.5 py-0.5 font-display text-xs font-semibold uppercase tracking-wide text-primary ${className}`}
      {...props}
    />
  );
}
