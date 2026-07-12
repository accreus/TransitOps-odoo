"use server";

import { createClient } from "@/lib/supabase/server";
import * as fuelExpenseService from "@/lib/services/fuel-expense-service";
import type { ServiceResult } from "@/lib/types";
import type { FuelEntry, ExpenseEntry } from "@/types";

async function requireAuth(): Promise<ServiceResult<string>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { success: false, error: "Unauthorized" };
  return { success: true, data: user.id };
}

export async function getFuelEntries(vehicleId?: string): Promise<ServiceResult<FuelEntry[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.getFuelEntries(vehicleId);
}

export async function addFuelEntry(entry: Omit<FuelEntry, "id">): Promise<ServiceResult<FuelEntry>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.addFuelEntry(entry);
}

export async function getExpenses(vehicleId?: string): Promise<ServiceResult<ExpenseEntry[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.getExpenses(vehicleId);
}

export async function addExpense(entry: Omit<ExpenseEntry, "id">): Promise<ServiceResult<ExpenseEntry>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.addExpense(entry);
}

export async function getOperationalCost(
  vehicleId: string,
): Promise<ServiceResult<{ fuel: number; expenses: number; maintenance: number; total: number }>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.getOperationalCost(vehicleId);
}
