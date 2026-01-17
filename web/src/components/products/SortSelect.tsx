"use client";

export type SortKey = "curated" | "newest" | "price";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-card border border-border-soft bg-bg-surface px-4 py-3 shadow-soft">
      <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Trier</span>
      <select
        className="w-full bg-transparent text-sm text-text-primary outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        <option value="curated">Sélection</option>
        <option value="newest">Nouveautés</option>
        <option value="price">Prix</option>
      </select>
    </label>
  );
}
