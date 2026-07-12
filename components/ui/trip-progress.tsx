"use client";

import { cn } from "@/lib/cn";
import type { TripStatus } from "@/types";

interface TripProgressProps {
  status: TripStatus;
  className?: string;
}

const statusProgress: Record<TripStatus, number> = {
  draft: 0,
  dispatched: 25,
  in_transit: 60,
  completed: 100,
  cancelled: 0,
};

const statusColors: Record<TripStatus, string> = {
  draft: "bg-muted-foreground/40",
  dispatched: "bg-status-dispatched",
  in_transit: "bg-status-in-transit",
  completed: "bg-status-completed",
  cancelled: "bg-status-cancelled",
};

export function TripProgress({ status, className }: TripProgressProps) {
  const progress = statusProgress[status] || 0;
  const color = statusColors[status] || "bg-muted-foreground";

  if (status === "cancelled") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-status-cancelled/40 rounded-full" style={{ width: "100%" }} />
        </div>
        <span className="text-[0.6rem] font-mono text-status-cancelled">CANCELLED</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", color)}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[0.6rem] font-mono text-muted-foreground tabular-nums w-8 text-right">
        {progress}%
      </span>
    </div>
  );
}
