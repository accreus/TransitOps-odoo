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
  Activity,
  MapPin,
  Clock,
  Fuel,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const regions = ["All Regions", "Northeast", "Southeast", "Midwest", "West", "Southwest"];
const vehicleTypes = ["All Types", "truck", "van", "trailer", "tanker"];
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

  const activeTripDetails = useMemo(() => {
    return trips
      .filter((t) => t.status === "in_transit" || t.status === "dispatched")
      .map((t) => ({
        ...t,
        vehicle: vehicles.find((v) => v.id === t.vehicleId),
        driver: drivers.find((d) => d.id === t.driverId),
      }))
      .slice(0, 3);
  }, [trips, vehicles, drivers]);

  return (
    <div className="space-y-5">
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

      {/* KPI Strip — departures board style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 60} />
        ))}
      </div>

      {/* ─── TWO-PANEL DISPATCH CONSOLE ─── */}
      <div className="grid lg:grid-cols-5 gap-4 min-h-[600px]">

        {/* ═══ LEFT PANEL (3/5) — Vehicle Fleet Board ═══ */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Filters row */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-36">
              <Select
                label="Region"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                options={regions.map((r) => ({ value: r, label: r }))}
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                label="Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={vehicleTypes.map((t) => ({ value: t, label: t === "All Types" ? t : t.charAt(0).toUpperCase() + t.slice(1) }))}
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={vehicleStatuses.map((s) => ({ value: s, label: s === "All Status" ? s : s.replace("_", " ").toUpperCase() }))}
              />
            </div>
            <div className="ml-auto">
              <Link
                href="/vehicles"
                className="inline-flex items-center gap-1.5 px-3 h-9 bg-secondary text-secondary-foreground rounded-sm text-xs font-display uppercase tracking-wider hover:bg-secondary/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Full Registry <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Vehicle Status Board — the main table */}
          <div className="flex-1 bg-card border border-border rounded-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Vehicle Fleet Board
              </h2>
              <span className="mono-data text-[0.65rem] text-muted-foreground">
                {filteredVehicles.length} / {vehicles.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full table-fixed text-sm" role="table">
                <colgroup>
                  <col className="w-[22%] sm:w-[15%]" />
                  <col className="w-[12%] hidden sm:table-column" />
                  <col className="w-[25%] hidden md:table-column" />
                  <col className="w-[18%] hidden lg:table-column" />
                  <col className="w-[15%] hidden xl:table-column" />
                  <col className="w-[20%] sm:w-[15%]" />
                </colgroup>
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap">REG</th>
                    <th className="text-left px-4 py-2 font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap hidden sm:table-cell">TYPE</th>
                    <th className="text-left px-4 py-2 font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap hidden md:table-cell">VEHICLE</th>
                    <th className="text-left px-4 py-2 font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap hidden lg:table-cell">REGION</th>
                    <th className="text-left px-4 py-2 font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap hidden xl:table-cell">ODOMETER</th>
                    <th className="text-right px-4 py-2 font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle, i) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-border/30 table-row-hover animate-manifest-print"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-4 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="mono-data font-semibold text-foreground text-xs">{vehicle.regNumber}</span>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell whitespace-nowrap">
                        <span className="text-[0.65rem] uppercase text-muted-foreground font-display tracking-wider">{vehicle.type}</span>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-xs text-foreground">{vehicle.make} {vehicle.model}</span>
                        <span className="text-[0.6rem] text-muted-foreground ml-1.5">{vehicle.year}</span>
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell whitespace-nowrap">
                        <span className="text-[0.65rem] text-muted-foreground">{vehicle.region}</span>
                      </td>
                      <td className="px-4 py-2 hidden xl:table-cell whitespace-nowrap">
                        <span className="mono-data text-[0.65rem] text-muted-foreground">{vehicle.currentOdometer.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <StatusBadge status={vehicle.status} />
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <Truck className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" aria-hidden="true" />
                        <p className="text-xs text-muted-foreground">No vehicles match filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL (2/5) — Activity Feed ═══ */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Active Trips — live operations */}
          <div className="bg-card border border-border rounded-sm overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-status-in-transit" aria-hidden="true" />
                Live Operations
              </h2>
              <Link
                href="/trips"
                className="text-[0.65rem] text-primary hover:text-primary/80 font-display uppercase tracking-wider flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                All <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-border/30">
              {activeTripDetails.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MapPin className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1.5" aria-hidden="true" />
                  <p className="text-[0.65rem] text-muted-foreground">No active operations</p>
                </div>
              ) : (
                activeTripDetails.map((trip, i) => (
                  <div
                    key={trip.id}
                    className="px-4 py-3 animate-manifest-print"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="mono-data text-[0.65rem] font-bold text-foreground">{trip.tripNumber}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <MapPin className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                      <span className="truncate">{trip.source}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-primary shrink-0" aria-hidden="true" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[0.6rem] text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Truck className="h-2.5 w-2.5" aria-hidden="true" />
                        {trip.vehicle?.regNumber || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                        {trip.driver?.name || "—"}
                      </span>
                      <span>{trip.cargoWeightKg.toLocaleString()} kg</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Trips */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                Recent Activity
              </h2>
              <Link
                href="/trips"
                className="text-[0.65rem] text-primary hover:text-primary/80 font-display uppercase tracking-wider flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                All <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-border/30">
              {recentTrips.map((trip, i) => (
                <div
                  key={trip.id}
                  className="px-4 py-2.5 flex items-center justify-between animate-manifest-print"
                  style={{ animationDelay: `${i * 40 + 100}ms` }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono-data text-[0.65rem] font-semibold text-foreground">{trip.tripNumber}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[0.6rem] text-muted-foreground mt-0.5">
                      <span className="truncate">{trip.source}</span>
                      <ArrowRight className="h-2 w-2 text-primary shrink-0" aria-hidden="true" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className={cn(
            "bg-card border rounded-sm overflow-hidden",
            alerts.length > 0 ? "border-destructive/30" : "border-border"
          )}>
            <div className="px-4 py-2.5 border-b border-border bg-secondary/20">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Alerts
                {alerts.length > 0 && (
                  <span className="ml-1 h-4 min-w-[16px] inline-flex items-center justify-center px-1 bg-destructive text-destructive-foreground rounded-sm text-[0.55rem] font-mono font-bold">
                    {alerts.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-border/30">
              {alerts.map((alert, i) => (
                <div
                  key={alert.id}
                  className={cn(
                    "px-4 py-2.5 flex items-start gap-2.5 animate-manifest-print",
                    alert.severity === "high" && "bg-destructive/5"
                  )}
                  style={{ animationDelay: `${i * 40 + 200}ms` }}
                >
                  <alert.icon
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      alert.severity === "high" ? "text-destructive" : "text-primary"
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-[0.65rem] text-muted-foreground">All clear — no active alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/fuel-expenses"
              className="bg-card border border-border rounded-sm p-3 flex items-center gap-2.5 hover:border-primary/30 hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Fuel className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[0.65rem] font-display uppercase tracking-wider text-foreground font-semibold">Fuel Log</p>
                <p className="text-[0.55rem] text-muted-foreground">Track fuel entries</p>
              </div>
            </Link>
            <Link
              href="/reports"
              className="bg-card border border-border rounded-sm p-3 flex items-center gap-2.5 hover:border-primary/30 hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <BarChart3 className="h-4 w-4 text-status-on-trip shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[0.65rem] font-display uppercase tracking-wider text-foreground font-semibold">Reports</p>
                <p className="text-[0.55rem] text-muted-foreground">Analytics & export</p>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
