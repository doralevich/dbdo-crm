import { cn } from "../lib/utils";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface p-5 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn("text-sm font-semibold text-text-primary", className)}>
      {children}
    </h3>
  );
}
