"use client";

import { useAuthStore, useVehicleStore, useDriverStore, useTripStore } from "@/stores";
import { Select } from "@/components/ui/form-elements";
import type { UserRole } from "@/types";
import { User, Shield, Truck, RotateCcw } from "lucide-react";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "driver", label: "Driver" },
  { value: "safety_officer", label: "Safety Officer" },
  { value: "financial_analyst", label: "Financial Analyst" },
];

export default function SettingsPage() {
  const { user, switchRole } = useAuthStore();
  const { vehicles } = useVehicleStore();
  const { drivers } = useDriverStore();
  const { trips } = useTripStore();

  if (!user) return null;

  const stats = [
    { label: "Vehicles", value: vehicles.length, icon: Truck },
    { label: "Drivers", value: drivers.length, icon: User },
    { label: "Trips", value: trips.length, icon: RotateCcw },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          ACCOUNT & SYSTEM PREFERENCES
        </p>
      </div>

      <div className="hazard-divider" />

      {/* Profile */}
      <div className="bg-card border border-border rounded-sm p-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-primary" aria-hidden="true" />
          Operator Profile
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{user.avatar}</span>
          </div>
          <div>
            <p className="text-foreground font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Select
            label="Active Role (Demo Switch)"
            value={user.role}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            options={roleOptions}
          />
          <p className="text-xs text-muted-foreground">
            Switch roles to see different views. In production, roles are assigned by administrators.
          </p>
        </div>
      </div>

      {/* System info */}
      <div className="bg-card border border-border rounded-sm p-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
          System Information
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-secondary/30 rounded-sm">
              <stat.icon className="h-5 w-5 text-muted-foreground mx-auto mb-1" aria-hidden="true" />
              <p className="mono-data text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[0.6rem] font-display uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground font-mono space-y-1">
          <p>TransitOps v0.1.0 — Fleet Command Center</p>
          <p>Mock data mode — all changes are session-local</p>
        </div>
      </div>
    </div>
  );
}
