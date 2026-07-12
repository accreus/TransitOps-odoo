"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { Vehicle, VehicleStatus } from "@/types";

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  setStatus: (id: string, status: VehicleStatus) => Promise<void>;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase.from("vehicles").select("*").order("reg_number");

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ vehicles: mapRowsToCamelCase<Vehicle>(data ?? []), loading: false });
  },

  addVehicle: async (v) => {
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").insert(mapToSnakeCase(v as unknown as Record<string, unknown>));
    if (!error) get().fetchAll();
  },

  updateVehicle: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update(mapToSnakeCase(updates as unknown as Record<string, unknown>))
      .eq("id", id);
    if (!error) get().fetchAll();
  },

  removeVehicle: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (!error) get().fetchAll();
  },

  setStatus: async (id, status) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update({ status })
      .eq("id", id);
    if (!error) get().fetchAll();
  },
}));
