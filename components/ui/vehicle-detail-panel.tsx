"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Wrench, Fuel, Calendar, Gauge } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/cn";
import type { Vehicle } from "@/types";

interface VehicleDetailPanelProps {
  vehicle: Vehicle;
  fuelCost?: number;
  expenseCost?: number;
  className?: string;
}

export function VehicleDetailPanel({ vehicle, fuelCost = 0, expenseCost = 0, className }: VehicleDetailPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("border border-border/50 rounded-sm overflow-hidden", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="mono-data text-xs font-semibold text-foreground">{vehicle.regNumber}</span>
          <StatusBadge status={vehicle.status} />
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className="px-3 py-3 border-t border-border/50 bg-secondary/20 animate-stagger-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-start gap-2">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[0.6rem] font-display uppercase tracking-wider text-muted-foreground">Odometer</p>
                <p className="mono-data text-xs text-foreground">{vehicle.currentOdometer.toLocaleString()} mi</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[0.6rem] font-display uppercase tracking-wider text-muted-foreground">Last Service</p>
                <p className="mono-data text-xs text-foreground">{vehicle.lastServiceDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Fuel className="h-3.5 w-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[0.6rem] font-display uppercase tracking-wider text-muted-foreground">Fuel Cost</p>
                <p className="mono-data text-xs text-foreground">${fuelCost.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[0.6rem] font-display uppercase tracking-wider text-muted-foreground">Total Expenses</p>
                <p className="mono-data text-xs text-foreground">${expenseCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {vehicle.make} {vehicle.model} ({vehicle.year}) — {vehicle.fuelType.toUpperCase()} — Max load: {vehicle.maxLoadKg.toLocaleString()} kg
          </div>
        </div>
      )}
    </div>
  );
}
