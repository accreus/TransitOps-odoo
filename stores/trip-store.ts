"use client";

import { create } from "zustand";
import type { Trip, TripStatus } from "@/types";
import { mockTrips } from "@/data/mock-data";

interface TripState {
  trips: Trip[];
  addTrip: (t: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  removeTrip: (id: string) => void;
  setStatus: (id: string, status: TripStatus) => void;
  dispatchTrip: (id: string) => void;
  completeTrip: (id: string, fuelUsed: number, revenue: number) => void;
  cancelTrip: (id: string) => void;
}

export const useTripStore = create<TripState>((set) => ({
  trips: mockTrips,
  addTrip: (t) => set((s) => ({ trips: [...s.trips, t] })),
  updateTrip: (id, updates) =>
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTrip: (id) =>
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
  setStatus: (id, status) =>
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
  dispatchTrip: (id) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === id
          ? { ...t, status: "dispatched" as TripStatus, actualDeparture: new Date().toISOString() }
          : t
      ),
    })),
  completeTrip: (id, fuelUsed, revenue) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === id
          ? { ...t, status: "completed" as TripStatus, actualArrival: new Date().toISOString(), fuelUsedLiters: fuelUsed, revenue }
          : t
      ),
    })),
  cancelTrip: (id) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === id ? { ...t, status: "cancelled" as TripStatus } : t
      ),
    })),
}));
