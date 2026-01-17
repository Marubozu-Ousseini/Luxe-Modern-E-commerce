"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export type Filters = {
  materials: string[];
  colors: string[];
  sizes: string[];
  fit: string[];
};

const groups: Array<{ key: keyof Filters; label: string }> = [
  { key: "materials", label: "Matières" },
  { key: "colors", label: "Couleur" },
  { key: "sizes", label: "Taille" },
  { key: "fit", label: "Coupe" },
];

export function FilterBar({
  options,
  value,
  onChange,
}: {
  options: Filters;
  value: Filters;
  onChange: (next: Filters) => void;
}) {
  const [openKey, setOpenKey] = useState<keyof Filters | null>(null);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const g of groups) result[g.key] = value[g.key].length;
    return result;
  }, [value]);

  function toggle(key: keyof Filters, item: string) {
    const set = new Set(value[key]);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    onChange({ ...value, [key]: Array.from(set) } as Filters);
  }

  function clearAll() {
    onChange({ materials: [], colors: [], sizes: [], fit: [] });
  }

  return (
    <div className="rounded-modal border border-border-soft bg-bg-surface p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-xs uppercase tracking-[0.12em] text-text-muted">Affiner</span>

        {groups.map((g) => {
          const open = openKey === g.key;
          const count = counts[g.key] ?? 0;
          return (
            <div key={g.key} className="relative">
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : g.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border-soft bg-bg-subtle px-4 py-2 text-sm text-text-primary transition duration-150 ease-premium hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                  open && "bg-bg-surface"
                )}
              >
                {g.label}
                {count > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-xs text-bg-surface">
                    {count}
                  </span>
                ) : null}
                <span className={cn("text-text-muted transition duration-200 ease-premium", open && "rotate-180")} aria-hidden>
                  ˅
                </span>
              </button>

              <div
                className={cn(
                  "absolute left-0 top-[calc(100%+10px)] z-20 w-64 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft transition duration-200 ease-premium",
                  open ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                <div className="max-h-64 overflow-auto p-3">
                  {options[g.key].map((item) => {
                    const checked = value[g.key].includes(item);
                    return (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-card px-3 py-2 text-sm text-text-primary hover:bg-bg-subtle"
                      >
                        <span className="text-text-primary">{item}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(g.key, item)}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={clearAll}
          className="ml-auto rounded-full border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-muted transition duration-150 ease-premium hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
