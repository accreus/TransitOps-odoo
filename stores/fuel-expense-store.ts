"use client";

import { create } from "zustand";
import type { FuelEntry, ExpenseEntry } from "@/types";
import { mockFuelEntries, mockExpenses } from "@/data/mock-data";

interface FuelExpenseState {
  fuelEntries: FuelEntry[];
  expenses: ExpenseEntry[];
  addFuelEntry: (e: FuelEntry) => void;
  addExpense: (e: ExpenseEntry) => void;
  getTotalFuelCost: (vehicleId: string) => number;
  getTotalExpenses: (vehicleId: string) => number;
  getOperationalCost: (vehicleId: string) => number;
}

export const useFuelExpenseStore = create<FuelExpenseState>((set, get) => ({
  fuelEntries: mockFuelEntries,
  expenses: mockExpenses,
  addFuelEntry: (e) => set((s) => ({ fuelEntries: [...s.fuelEntries, e] })),
  addExpense: (e) => set((s) => ({ expenses: [...s.expenses, e] })),
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
