"use client";

import { useMemo, useState } from "react";
import { useVehicleStore, useDriverStore, useTripStore } from "@/stores";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/form-elements";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import {
  Truck,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const regions = ["All Regions", "Northeast", "Southeast", "Midwest", "West", "Southwest"];
const vehicleTypes = ["All Types", "truck", "van", "trailer", " tanker"];
const vehicleStatuses = ["All Status", "available", "on_trip", "in_shop", "retired"];

export default function DashboardPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);

  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const alerts = useMemo(() => {
    const now = new Date("2026-07-12").getTime();
    const items: { id: string; message: string; severity: "high" | "medium"; icon: React.ElementType }[] = [];

    drivers.forEach((d) => {
      const expiry = new Date(d.licenseExpiry);
      const daysUntil = Math.ceil((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
      if (daysUntil < 90 && daysUntil > 0) {
        items.push({
          id: `lic-${d.id}`,
          message: `${d.name}'s license expires in ${daysUntil} days`,
          severity: daysUntil < 30 ? "high" : "medium",
          icon: AlertTriangle,
        });
      }
    });

    vehicles.forEach((v) => {
      if (v.status === "in_shop") {
        items.push({
          id: `shop-${v.id}`,
          message: `${v.regNumber} (${v.make} ${v.model}) is in the shop`,
          severity: "medium",
          icon: Truck,
        });
      }
    });

    return items.slice(0, 5);
  }, [drivers, vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (regionFilter !== "All Regions" && v.region !== regionFilter) return false;
      if (typeFilter !== "All Types" && v.type !== typeFilter) return false;
      if (statusFilter !== "All Status" && v.status !== statusFilter) return false;
      return true;
    });
  }, [vehicles, regionFilter, typeFilter, statusFilter]);

  const kpis = useMemo(() => {
    const active = vehicles.filter((v) => v.status === "on_trip").length;
    const available = vehicles.filter((v) => v.status === "available").length;
    const inShop = vehicles.filter((v) => v.status === "in_shop").length;
    const activeTrips = trips.filter((t) => t.status === "in_transit" || t.status === "dispatched").length;
    const pendingTrips = trips.filter((t) => t.status === "draft").length;
    const driversOnDuty = drivers.filter((d) => d.status === "on_trip" || d.status === "available").length;
    const totalVehicles = vehicles.filter((v) => v.status !== "retired").length;
    const utilization = totalVehicles > 0 ? Math.round((active / totalVehicles) * 100) : 0;

    return [
      { label: "Active Vehicles", value: active, icon: "truck", color: "blue" as const },
      { label: "Available", value: available, icon: "package-check", color: "green" as const },
      { label: "In Maintenance", value: inShop, icon: "wrench", color: "amber" as const },
      { label: "Active Trips", value: activeTrips, icon: "route", color: "blue" as const },
      { label: "Pending Trips", value: pendingTrips, icon: "clipboard-list", color: "slate" as const },
      { label: "Drivers On Duty", value: driversOnDuty, icon: "users", color: "green" as const },
      { label: "Fleet Utilization", value: utilization, unit: "%", icon: "gauge", color: "amber" as const, change: 3.2 },
    ];
  }, [vehicles, drivers, trips]);

  const recentTrips = useMemo(() => {
    return [...trips]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [trips]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Dispatch Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {format(new Date(), "EEE, dd MMM yyyy").toUpperCase()} — {vehicles.filter((v) => v.status !== "retired").length} VEHICLES IN FLEET
          </p>
        </div>
      </div>

      <div className="hazard-divider" />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 60} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="Region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={regions.map((r) => ({ value: r, label: r }))}
          />
        </div>
        <div className="w-44">
          <Select
            label="Vehicle Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={vehicleTypes.map((t) => ({ value: t, label: t === "All Types" ? t : t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
        </div>
        <div className="w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={vehicleStatuses.map((s) => ({ value: s, label: s === "All Status" ? s : s.replace("_", " ").toUpperCase() }))}
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Vehicle Status Board */}
        <div className="lg:col-span-2 bg-card border border-border rounded-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Vehicle Status Board
            </h2>
            <Link
              href="/vehicles"
              className="text-xs text-primary hover:text-primary/80 font-display uppercase tracking-wider flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              View All <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">REG</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">TYPE</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">MAKE</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden lg:table-cell">REGION</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden xl:table-cell">ODOMETER</th>
                  <th className="text-right px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle, i) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-border/50 table-row-hover animate-manifest-print"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="mono-data font-semibold text-foreground">{vehicle.regNumber}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="text-xs uppercase text-muted-foreground">{vehicle.type}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-foreground">{vehicle.make} {vehicle.model}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{vehicle.region}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden xl:table-cell">
                      <span className="mono-data text-xs text-muted-foreground">{vehicle.currentOdometer.toLocaleString()} mi</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusBadge status={vehicle.status} />
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-muted-foreground">No vehicles match the current filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Recent Trips + Alerts */}
        <div className="space-y-4">
          {/* Recent Trips */}
          <div className="bg-card border border-border rounded-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                Recent Trips
              </h2>
              <Link
                href="/trips"
                className="text-xs text-primary hover:text-primary/80 font-display uppercase tracking-wider flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                View All <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-border/50">
              {recentTrips.map((trip, i) => (
                <div
                  key={trip.id}
                  className="px-4 py-3 animate-manifest-print"
                  style={{ animationDelay: `${i * 50 + 200}ms` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="mono-data text-xs font-semibold text-foreground">{trip.tripNumber}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{trip.source}</span>
                    <ArrowRight className="h-3 w-3 text-primary" aria-hidden="true" />
                    <span>{trip.destination}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" aria-hidden="true" />
                Alerts
              </h2>
            </div>
            <div className="divide-y divide-border/50">
              {alerts.map((alert, i) => (
                <div
                  key={alert.id}
                  className={cn(
                    "px-4 py-3 flex items-start gap-3 animate-manifest-print",
                    alert.severity === "high" && "bg-destructive/5"
                  )}
                  style={{ animationDelay: `${i * 50 + 400}ms` }}
                >
                  <alert.icon
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      alert.severity === "high" ? "text-destructive" : "text-primary"
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-xs text-foreground">{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">All clear — no active alerts.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
