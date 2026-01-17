import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "subtle" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-card px-5 py-3 text-sm font-medium transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 motion-reduce:transform-none";

  const styles =
    variant === "primary"
      ? "bg-accent text-bg-surface shadow-soft hover:scale-[1.02]"
      : variant === "subtle"
        ? "border border-border-soft bg-bg-surface text-text-primary shadow-soft hover:translate-y-[-1px]"
        : "text-text-primary hover:bg-bg-surface";

  return <button className={cn(base, styles, className)} {...props} />;
}
