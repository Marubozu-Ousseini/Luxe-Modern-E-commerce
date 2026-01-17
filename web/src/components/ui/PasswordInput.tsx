"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { IconEye, IconEyeOff } from "@/components/ui/Icons";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export function PasswordInput({ className, label, id, ...props }: Props) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [visible, setVisible] = useState(false);

  return (
    <label className={cn(label ? "block text-sm text-text-primary" : "block")}
      htmlFor={label ? inputId : undefined}
    >
      {label ? label : null}
      <div className={cn("relative", label ? "mt-2" : undefined)}>
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={cn(
            "w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 pr-12 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-card p-1 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}
