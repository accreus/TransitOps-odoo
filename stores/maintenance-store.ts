"use client";

import { create } from "zustand";
import type { MaintenanceLog } from "@/types";
import { mockMaintenanceLogs } from "@/data/mock-data";
import { useVehicleStore } from "./vehicle-store";

interface MaintenanceState {
  logs: MaintenanceLog[];
  addLog: (log: MaintenanceLog) => void;
  updateLog: (id: string, updates: Partial<MaintenanceLog>) => void;
  startMaintenance: (vehicleId: string, log: MaintenanceLog) => void;
  completeMaintenance: (id: string) => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  logs: mockMaintenanceLogs,
  addLog: (log) => set((s) => ({ logs: [...s.logs, log] })),
  updateLog: (id, updates) =>
    set((s) => ({
      logs: s.logs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  startMaintenance: (vehicleId, log) => {
    useVehicleStore.getState().setStatus(vehicleId, "in_shop");
    set((s) => ({ logs: [...s.logs, log] }));
  },
  completeMaintenance: (id) => {
    const log = get().logs.find((l) => l.id === id);
    if (log) {
      useVehicleStore.getState().setStatus(log.vehicleId, "available");
      set((s) => ({
        logs: s.logs.map((l) =>
          l.id === id ? { ...l, status: "completed", completedDate: new Date().toISOString().split("T")[0] } : l
        ),
      }));
    }
  },
}));
