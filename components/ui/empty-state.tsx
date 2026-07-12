"use client";

import { cn } from "@/lib/cn";
import { Inbox, Search, Plus } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="h-14 w-14 rounded-sm bg-secondary flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-xs font-display uppercase tracking-wider hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {action.label}
        </button>
      )}
    </div>
  );
}

interface SearchEmptyProps {
  query: string;
  className?: string;
}

export function SearchEmpty({ query, className }: SearchEmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <Search className="h-8 w-8 text-muted-foreground/40 mb-2" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        No results for &ldquo;<span className="text-foreground font-semibold">{query}</span>&rdquo;
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Try a different search term or clear filters
      </p>
    </div>
  );
}
