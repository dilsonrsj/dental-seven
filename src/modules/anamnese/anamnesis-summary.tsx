type AnamnesisSummaryProps = {
  badges: string[];
};

export function AnamnesisSummary({ badges }: AnamnesisSummaryProps) {
  if (badges.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
    >
      <p className="font-display text-sm font-semibold text-amber-300">
        Alertas clínicos
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <li
            key={badge}
            className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200"
          >
            {badge}
          </li>
        ))}
      </ul>
    </div>
  );
}
