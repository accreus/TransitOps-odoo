"use client";

import { useVehicleStore, useDriverStore, useTripStore } from "@/stores";
import { cn } from "@/lib/cn";

export function SystemFooter() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);

  const activeVehicles = vehicles.filter((v) => v.status === "on_trip").length;
  const activeTrips = trips.filter((t) => t.status === "in_transit").length;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

  return (
    <footer className="hidden lg:flex items-center justify-between px-4 py-1.5 border-t border-border bg-card/30 text-[0.6rem] font-mono text-muted-foreground/60 flex-shrink-0">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-status-available animate-pulse" aria-hidden="true" />
          SYSTEM ONLINE
        </span>
        <span>{vehicles.length} vehicles</span>
        <span>{drivers.length} drivers</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{activeVehicles} active</span>
        <span>{activeTrips} trips in transit</span>
        <span className="tabular-nums">{timeStr} UTC</span>
      </div>
    </footer>
  );
}
