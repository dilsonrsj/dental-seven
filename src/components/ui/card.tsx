import { HTMLAttributes, forwardRef } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-surface transition-colors hover:border-primary/50 ${className}`}
      {...props}
    />
  ),
);

Card.displayName = "Card";

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col gap-1.5 p-6 pb-0 ${className}`}
      {...props}
    />
  ),
);

CardHeader.displayName = "CardHeader";

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-display text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  ),
);

CardTitle.displayName = "CardTitle";

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className}`} {...props} />
  ),
);

CardContent.displayName = "CardContent";
