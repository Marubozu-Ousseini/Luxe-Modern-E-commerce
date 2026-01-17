"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export function Accordion({
  items,
}: {
  items: Array<{ title: string; content: React.ReactNode }>;
}) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border-soft rounded-modal border border-border-soft bg-bg-surface">
      {items.map((item, index) => {
        const open = openIndex === index;
        const contentId = `${baseId}-${index}-content`;
        return (
          <div key={item.title}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-expanded={open}
              aria-controls={contentId}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span className="font-medium text-text-primary">{item.title}</span>
              <span
                className={cn(
                  "text-text-muted transition duration-200 ease-premium",
                  open && "rotate-180"
                )}
                aria-hidden
              >
                ˅
              </span>
            </button>
            <div
              id={contentId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-250 ease-premium motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm leading-6 text-text-muted">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
