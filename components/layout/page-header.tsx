"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: boolean;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, breadcrumbs = true, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs && <Breadcrumbs />}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="hazard-divider" />
    </div>
  );
}
