"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

interface LiveClockProps {
  className?: string;
}

export function LiveClock({ className }: LiveClockProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const formatted = time.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateFormatted = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="text-right">
        <p className="mono-data text-lg font-bold text-foreground tabular-nums">{formatted}</p>
        <p className="text-[0.6rem] text-muted-foreground font-mono uppercase">{dateFormatted}</p>
      </div>
      <button
        onClick={handleRefresh}
        className={cn(
          "p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isRefreshing && "animate-spin"
        )}
        aria-label="Refresh data"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
