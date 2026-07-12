"use client";

import { useMemo, useState } from "react";
import { useVehicleStore, useTripStore, useFuelExpenseStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";

const chartColors = ["#ffb020", "#3b82f6", "#22c55e", "#dc2626", "#8b5cf6", "#06b6d4", "#f59e0b"];

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#1a1d21",
    border: "1px solid #2e3238",
    borderRadius: "2px",
    fontSize: "12px",
    fontFamily: "JetBrains Mono, monospace",
    color: "#e8e6e3",
  },
};

export default function ReportsPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const { fuelEntries, expenses } = useFuelExpenseStore();
  const [activeChart, setActiveChart] = useState<"utilization" | "fuel" | "cost" | "roi">("utilization");

  const utilizationData = useMemo(() => {
    const statusCounts = vehicles.reduce(
      (acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(statusCounts)
      .filter(([key]) => key !== "retired")
      .map(([status, count]) => ({
        name: status.replace("_", " ").toUpperCase(),
        value: count,
      }));
  }, [vehicles]);

  const fuelEfficiencyData = useMemo(() => {
    const completedTrips = trips.filter((t) => t.status === "completed" && t.fuelUsedLiters > 0);
    return completedTrips.map((t) => ({
      name: t.tripNumber,
      kmPerLiter: t.distanceKm / t.fuelUsedLiters,
      distance: t.distanceKm,
      fuel: t.fuelUsedLiters,
    }));
  }, [trips]);

  const operationalCostData = useMemo(() => {
    const costByMonth: Record<string, { fuel: number; expenses: number; total: number }> = {};

    fuelEntries.forEach((e) => {
      const month = e.date.slice(0, 7);
      if (!costByMonth[month]) costByMonth[month] = { fuel: 0, expenses: 0, total: 0 };
      costByMonth[month].fuel += e.totalCost;
      costByMonth[month].total += e.totalCost;
    });

    expenses.forEach((e) => {
      const month = e.date.slice(0, 7);
      if (!costByMonth[month]) costByMonth[month] = { fuel: 0, expenses: 0, total: 0 };
      costByMonth[month].expenses += e.amount;
      costByMonth[month].total += e.amount;
    });

    return Object.entries(costByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        name: month,
        Fuel: Math.round(data.fuel),
        Expenses: Math.round(data.expenses),
        Total: Math.round(data.total),
      }));
  }, [fuelEntries, expenses]);

  const vehicleRoiData = useMemo(() => {
    const completedTrips = trips.filter((t) => t.status === "completed");
    const vehicleStats: Record<string, { trips: number; totalCost: number; totalDistance: number }> = {};

    completedTrips.forEach((t) => {
      if (!vehicleStats[t.vehicleId]) vehicleStats[t.vehicleId] = { trips: 0, totalCost: 0, totalDistance: 0 };
      vehicleStats[t.vehicleId].trips += 1;
      vehicleStats[t.vehicleId].totalCost += t.totalCost;
      vehicleStats[t.vehicleId].totalDistance += t.distanceKm;
    });

    return Object.entries(vehicleStats)
      .map(([vId, stats]) => {
        const vehicle = vehicles.find((v) => v.id === vId);
        return {
          name: vehicle?.regNumber || vId,
          trips: stats.trips,
          costPerKm: stats.totalDistance > 0 ? Math.round((stats.totalCost / stats.totalDistance) * 100) / 100 : 0,
          totalCost: stats.totalCost,
          distance: stats.totalDistance,
        };
      })
      .sort((a, b) => b.trips - a.trips);
  }, [trips, vehicles]);

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => String(row[h])).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartTabs = [
    { key: "utilization" as const, label: "Fleet Utilization", icon: PieIcon },
    { key: "fuel" as const, label: "Fuel Efficiency", icon: TrendingUp },
    { key: "cost" as const, label: "Operational Cost", icon: BarChart3 },
    { key: "roi" as const, label: "Vehicle ROI", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            FLEET ANALYTICS & COST TRACKING
          </p>
        </div>
      </div>

      <div className="hazard-divider" />

      {/* Chart tabs */}
      <div className="flex flex-wrap gap-2">
        {chartTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveChart(tab.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-display uppercase tracking-wider transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activeChart === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-card border border-border rounded-sm p-6">
        {activeChart === "utilization" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                Fleet Status Distribution
              </h3>
              <Button variant="secondary" size="sm" onClick={() => exportCSV(utilizationData, "fleet-utilization.csv")}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {utilizationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === "fuel" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                Fuel Efficiency by Trip (km/L)
              </h3>
              <Button variant="secondary" size="sm" onClick={() => exportCSV(fuelEfficiencyData, "fuel-efficiency.csv")}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3238" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7a8290", fontFamily: "JetBrains Mono" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#7a8290", fontFamily: "JetBrains Mono" }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="kmPerLiter" fill="#ffb020" name="km/L" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === "cost" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                Monthly Operational Costs
              </h3>
              <Button variant="secondary" size="sm" onClick={() => exportCSV(operationalCostData, "operational-costs.csv")}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationalCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3238" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7a8290", fontFamily: "JetBrains Mono" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#7a8290", fontFamily: "JetBrains Mono" }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }} />
                  <Bar dataKey="Fuel" stackId="cost" fill="#ffb020" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Expenses" stackId="cost" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === "roi" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                Vehicle Cost per Km
              </h3>
              <Button variant="secondary" size="sm" onClick={() => exportCSV(vehicleRoiData, "vehicle-roi.csv")}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleRoiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3238" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7a8290", fontFamily: "JetBrains Mono" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#7a8290", fontFamily: "JetBrains Mono" }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }} />
                  <Bar dataKey="costPerKm" fill="#ffb020" name="$/km" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-sm p-3 sm:p-4">
          <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Trips Completed</p>
          <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">
            {trips.filter((t) => t.status === "completed").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-sm p-3 sm:p-4">
          <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Distance</p>
          <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">
            {trips.filter((t) => t.status === "completed").reduce((s, t) => s + t.distanceKm, 0).toLocaleString()} km
          </p>
        </div>
        <div className="bg-card border border-border rounded-sm p-3 sm:p-4">
          <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Fuel Used</p>
          <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">
            {trips.filter((t) => t.status === "completed").reduce((s, t) => s + t.fuelUsedLiters, 0).toLocaleString()} L
          </p>
        </div>
        <div className="bg-card border border-border rounded-sm p-3 sm:p-4">
          <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Operational Spend</p>
          <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">
            ${fuelEntries.reduce((s, e) => s + e.totalCost, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
