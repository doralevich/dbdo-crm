import { cn } from "../lib/utils";

export default function EmptyState({ icon: Icon, title, description, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
          <Icon className="h-6 w-6 text-text-muted" />
        </div>
      )}
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-text-muted max-w-sm">{description}</p>
      )}
    </div>
  );
}
