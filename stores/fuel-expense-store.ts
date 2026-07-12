"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { FuelEntry, ExpenseEntry } from "@/types";

interface FuelExpenseState {
  fuelEntries: FuelEntry[];
  expenses: ExpenseEntry[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addFuelEntry: (e: FuelEntry) => Promise<void>;
  addExpense: (e: ExpenseEntry) => Promise<void>;
  getTotalFuelCost: (vehicleId: string) => number;
  getTotalExpenses: (vehicleId: string) => number;
  getOperationalCost: (vehicleId: string) => number;
}

export const useFuelExpenseStore = create<FuelExpenseState>((set, get) => ({
  fuelEntries: [],
  expenses: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();

    const [fuelResult, expenseResult] = await Promise.all([
      supabase.from("fuel_logs").select("*").order("date", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]);

    if (fuelResult.error || expenseResult.error) {
      set({
        loading: false,
        error: fuelResult.error?.message ?? expenseResult.error?.message ?? "Unknown error",
      });
      return;
    }

    set({
      fuelEntries: mapRowsToCamelCase<FuelEntry>(fuelResult.data ?? []),
      expenses: mapRowsToCamelCase<ExpenseEntry>(expenseResult.data ?? []),
      loading: false,
    });
  },

  addFuelEntry: async (e) => {
    const supabase = createClient();
    const row = mapToSnakeCase(e as unknown as Record<string, unknown>);
    delete row.id;
    const { error } = await supabase.from("fuel_logs").insert(row);
    if (!error) get().fetchAll();
  },

  addExpense: async (e) => {
    const supabase = createClient();
    const row = mapToSnakeCase(e as unknown as Record<string, unknown>);
    delete row.id;
    const { error } = await supabase.from("expenses").insert(row);
    if (!error) get().fetchAll();
  },

  getTotalFuelCost: (vehicleId) =>
    get()
      .fuelEntries.filter((e) => e.vehicleId === vehicleId)
      .reduce((sum, e) => sum + e.totalCost, 0),

  getTotalExpenses: (vehicleId) =>
    get()
      .expenses.filter((e) => e.vehicleId === vehicleId)
      .reduce((sum, e) => sum + e.amount, 0),

  getOperationalCost: (vehicleId) => {
    const fuel = get().getTotalFuelCost(vehicleId);
    const expenses = get().getTotalExpenses(vehicleId);
    return fuel + expenses;
  },
}));
