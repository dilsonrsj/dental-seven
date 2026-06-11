import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "outline";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg";
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(135deg,oklch(0.63_0.15_250),oklch(0.55_0.17_250))] text-primary-foreground hover:shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]",
  ghost: "bg-transparent text-foreground hover:bg-surface",
  outline: "border border-border bg-transparent hover:border-primary/50",
};

const sizes = { md: "h-11 px-4 text-sm", lg: "h-14 px-6 text-sm" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-xl font-display font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);

Button.displayName = "Button";
