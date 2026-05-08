import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-3xl font-semibold mt-2 tracking-tight">{value}</div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className={`mt-3 text-xs flex items-center gap-1 ${delta >= 0 ? "text-success" : "text-destructive"}`}>
          {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(delta)}% 较上周期
        </div>
      )}
    </div>
  );
}