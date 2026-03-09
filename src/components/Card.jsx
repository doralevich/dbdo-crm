import { cn } from "../lib/utils";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface p-5 transition-colors",
        "border border-border-subtle",
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
    <h3 className={cn("text-sm font-semibold text-text-primary tracking-tight", className)}>
      {children}
    </h3>
  );
}
