"use client";

import { create } from "zustand";
import type { Vehicle, VehicleStatus } from "@/types";
import { mockVehicles } from "@/data/mock-data";

interface VehicleState {
  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  setStatus: (id: string, status: VehicleStatus) => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: mockVehicles,
  addVehicle: (v) => set((s) => ({ vehicles: [...s.vehicles, v] })),
  updateVehicle: (id, updates) =>
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  removeVehicle: (id) =>
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),
  setStatus: (id, status) =>
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, status } : v)),
    })),
}));
