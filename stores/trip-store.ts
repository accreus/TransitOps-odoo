"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { Trip, TripStatus } from "@/types";

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addTrip: (t: Trip) => Promise<void>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;
  dispatchTrip: (id: string) => Promise<void>;
  departTrip: (id: string) => Promise<void>;
  completeTrip: (id: string, fuelUsed: number, revenue: number) => Promise<void>;
  cancelTrip: (id: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ trips: mapRowsToCamelCase<Trip>(data ?? []), loading: false });
  },

  addTrip: async (t) => {
    const supabase = createClient();
    const row = mapToSnakeCase(t as unknown as Record<string, unknown>);
    delete row.id;
    delete row.trip_number; // let DB/service generate
    const { error } = await supabase.from("trips").insert(row);
    if (!error) get().fetchAll();
  },

  updateTrip: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("trips")
      .update(mapToSnakeCase(updates as unknown as Record<string, unknown>))
      .eq("id", id);
    if (!error) get().fetchAll();
  },

  removeTrip: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (!error) get().fetchAll();
  },

  dispatchTrip: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("dispatch_trip", { trip_id: id });
    if (!error) get().fetchAll();
  },

  departTrip: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("depart_trip", { trip_id: id });
    if (!error) get().fetchAll();
  },

  completeTrip: async (id, fuelUsed, revenue) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("complete_trip", {
      trip_id: id,
      p_revenue: revenue,
      p_fuel_used: fuelUsed,
    });
    if (!error) get().fetchAll();
  },

  cancelTrip: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("cancel_trip", { trip_id: id });
    if (!error) get().fetchAll();
  },
}));
