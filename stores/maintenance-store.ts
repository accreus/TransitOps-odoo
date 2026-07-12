"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { MaintenanceLog } from "@/types";

interface MaintenanceState {
  logs: MaintenanceLog[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addLog: (log: MaintenanceLog) => Promise<void>;
  updateLog: (id: string, updates: Partial<MaintenanceLog>) => Promise<void>;
  startMaintenance: (vehicleId: string, log: MaintenanceLog) => Promise<void>;
  completeMaintenance: (id: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  logs: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ logs: mapRowsToCamelCase<MaintenanceLog>(data ?? []), loading: false });
  },

  addLog: async (log) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_logs")
      .insert(mapToSnakeCase(log as unknown as Record<string, unknown>));
    if (!error) get().fetchAll();
  },

  updateLog: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_logs")
      .update(mapToSnakeCase(updates as unknown as Record<string, unknown>))
      .eq("id", id);
    if (!error) get().fetchAll();
  },

  startMaintenance: async (vehicleId, log) => {
    const supabase = createClient();

    // Update vehicle status to in_shop
    await supabase.from("vehicles").update({ status: "in_shop" }).eq("id", vehicleId);

    // Insert maintenance log
    const { error } = await supabase
      .from("maintenance_logs")
      .insert(mapToSnakeCase(log as unknown as Record<string, unknown>));

    if (!error) get().fetchAll();
  },

  completeMaintenance: async (id) => {
    const supabase = createClient();
    const log = get().logs.find((l) => l.id === id);
    if (!log) return;

    // Restore vehicle to available
    await supabase.from("vehicles").update({ status: "available" }).eq("id", log.vehicleId);

    // Mark maintenance as completed
    await supabase
      .from("maintenance_logs")
      .update({ state: "closed", completed_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);

    get().fetchAll();
  },
}));
