import Card from "./Card";
import { cn } from "../lib/utils";

export default function StatCard({ label, value, icon: Icon, trend, trendUp, className }) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trendUp ? "text-emerald-400" : "text-red-400"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/10">
            <Icon className="h-5 w-5 text-brand-gold" />
          </div>
        )}
      </div>
    </Card>
  );
}
