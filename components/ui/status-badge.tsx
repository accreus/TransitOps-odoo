"use client";

import { cn } from "@/lib/cn";
import type { VehicleStatus, DriverStatus, TripStatus } from "@/types";

type StatusType = VehicleStatus | DriverStatus | TripStatus | "scheduled" | "in_progress";

const statusConfig: Record<string, { label: string; className: string }> = {
  available: {
    label: "AVAILABLE",
    className: "text-status-available border-status-available/50 bg-status-available/10",
  },
  on_trip: {
    label: "ON TRIP",
    className: "text-status-on-trip border-status-on-trip/50 bg-status-on-trip/10",
  },
  in_shop: {
    label: "IN SHOP",
    className: "text-status-in-shop border-status-in-shop/50 bg-status-in-shop/10",
  },
  retired: {
    label: "RETIRED",
    className: "text-status-retired border-status-retired/50 bg-status-retired/10",
  },
  suspended: {
    label: "SUSPENDED",
    className: "text-status-suspended border-status-suspended/50 bg-status-suspended/10",
  },
  off_duty: {
    label: "OFF DUTY",
    className: "text-status-off-duty border-status-off-duty/50 bg-status-off-duty/10",
  },
  draft: {
    label: "DRAFT",
    className: "text-status-draft border-status-draft/50 bg-status-draft/10",
  },
  dispatched: {
    label: "DISPATCHED",
    className: "text-status-dispatched border-status-dispatched/50 bg-status-dispatched/10",
  },
  in_transit: {
    label: "IN TRANSIT",
    className: "text-status-in-transit border-status-in-transit/50 bg-status-in-transit/10",
  },
  completed: {
    label: "COMPLETED",
    className: "text-status-completed border-status-completed/50 bg-status-completed/10",
  },
  cancelled: {
    label: "CANCELLED",
    className: "text-status-cancelled border-status-cancelled/50 bg-status-cancelled/10",
  },
  scheduled: {
    label: "SCHEDULED",
    className: "text-status-scheduled border-status-scheduled/50 bg-status-scheduled/10",
  },
  in_progress: {
    label: "IN PROGRESS",
    className: "text-status-in-progress border-status-in-progress/50 bg-status-in-progress/10",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  animate?: boolean;
}

export function StatusBadge({ status, className, animate = false }: StatusBadgeProps) {
  if (!status) return null;
  const config = statusConfig[status] || { label: status.toUpperCase(), className: "" };

  return (
    <span
      className={cn(
        "status-stamp",
        config.className,
        animate && "animate-stamp-in",
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
