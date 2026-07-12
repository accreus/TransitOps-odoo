"use client";

import { create } from "zustand";
import type { Driver, DriverStatus } from "@/types";
import { mockDrivers } from "@/data/mock-data";

interface DriverState {
  drivers: Driver[];
  addDriver: (d: Driver) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  removeDriver: (id: string) => void;
  setStatus: (id: string, status: DriverStatus) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  drivers: mockDrivers,
  addDriver: (d) => set((s) => ({ drivers: [...s.drivers, d] })),
  updateDriver: (id, updates) =>
    set((s) => ({
      drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDriver: (id) =>
    set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),
  setStatus: (id, status) =>
    set((s) => ({
      drivers: s.drivers.map((d) => (d.id === id ? { ...d, status } : d)),
    })),
}));
