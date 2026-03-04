import { cn } from "../lib/utils";

export default function Badge({ children, className, variant = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-surface-raised text-text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
