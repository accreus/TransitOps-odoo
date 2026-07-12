"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { Driver, DriverStatus } from "@/types";

interface DriverState {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addDriver: (d: Driver) => Promise<void>;
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  setStatus: (id: string, status: DriverStatus) => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  drivers: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase.from("drivers").select("*").order("name");

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ drivers: mapRowsToCamelCase<Driver>(data ?? []), loading: false });
  },

  addDriver: async (d) => {
    const supabase = createClient();
    const { error } = await supabase.from("drivers").insert(mapToSnakeCase(d as unknown as Record<string, unknown>));
    if (!error) get().fetchAll();
  },

  updateDriver: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("drivers")
      .update(mapToSnakeCase(updates as unknown as Record<string, unknown>))
      .eq("id", id);
    if (!error) get().fetchAll();
  },

  removeDriver: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (!error) get().fetchAll();
  },

  setStatus: async (id, status) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("drivers")
      .update({ status })
      .eq("id", id);
    if (!error) get().fetchAll();
  },
}));
