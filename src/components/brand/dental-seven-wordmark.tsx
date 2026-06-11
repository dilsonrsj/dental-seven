type Props = { className?: string; size?: "sm" | "lg" };

export function DentalSevenWordmark({ className = "", size = "lg" }: Props) {
  const textClass = size === "lg" ? "text-3xl sm:text-4xl" : "text-xl";
  return (
    <h1
      className={`font-display font-bold uppercase tracking-tight ${textClass} ${className}`}
    >
      Dental <span className="text-primary">Seven</span>
    </h1>
  );
}
