"use client";

import { cn } from "@/lib/cn";
import {
  Truck,
  PackageCheck,
  Wrench,
  Route,
  ClipboardList,
  Users,
  Gauge,
  TrendingUp,
  TrendingDown,
  Fuel,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  truck: Truck,
  "package-check": PackageCheck,
  wrench: Wrench,
  route: Route,
  "clipboard-list": ClipboardList,
  users: Users,
  gauge: Gauge,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  fuel: Fuel,
  "dollar-sign": DollarSign,
  "alert-triangle": AlertTriangle,
};

const colorMap: Record<string, string> = {
  amber: "border-l-primary text-primary",
  red: "border-l-destructive text-destructive",
  green: "border-l-status-available text-status-available",
  blue: "border-l-status-on-trip text-status-on-trip",
  slate: "border-l-muted-foreground text-muted-foreground",
};

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  change?: number;
  icon: string;
  color: "amber" | "red" | "green" | "blue" | "slate";
  delay?: number;
}

export function KpiCard({ label, value, unit, change, icon, color, delay = 0 }: KpiCardProps) {
  const Icon = iconMap[icon] || Truck;

  return (
    <div
      className={cn(
        "relative bg-card border border-border rounded-sm p-3 sm:p-4",
        "border-l-[3px]",
        colorMap[color],
        "animate-stagger-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[0.6rem] sm:text-[0.65rem] font-display font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="mono-data text-xl sm:text-2xl font-bold text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            {unit && (
              <span className="text-xs text-muted-foreground font-mono">{unit}</span>
            )}
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-mono",
              change >= 0 ? "text-status-available" : "text-destructive"
            )}>
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{change >= 0 ? "+" : ""}{change}%</span>
            </div>
          )}
        </div>
        <div className={cn("p-2 rounded-sm bg-secondary/50", colorMap[color])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
