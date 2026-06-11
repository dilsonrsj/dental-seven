import { InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={`flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  ),
);

Input.displayName = "Input";
