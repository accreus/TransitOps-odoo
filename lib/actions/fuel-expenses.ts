"use server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as fuelExpenseService from "@/lib/services/fuel-expense-service";
import { createFuelLogSchema, createExpenseSchema, updateFuelLogSchema, updateExpenseSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { FuelEntry, ExpenseEntry } from "@/types";

export async function getFuelEntries(vehicleId?: string): Promise<ServiceResult<FuelEntry[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.getFuelEntries(vehicleId);
}

export async function addFuelEntry(entry: Omit<FuelEntry, "id">): Promise<ServiceResult<FuelEntry>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "fuel", "create");
  if (!roleCheck.success) return roleCheck;

  const parsed = createFuelLogSchema.safeParse(entry);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return fuelExpenseService.addFuelEntry(entry);
}

export async function updateFuelEntry(id: string, updates: Partial<FuelEntry>): Promise<ServiceResult<FuelEntry>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "fuel", "update");
  if (!roleCheck.success) return roleCheck;

  const parsed = updateFuelLogSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return fuelExpenseService.updateFuelEntry(id, updates);
}

export async function deleteFuelEntry(id: string): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "fuel", "delete");
  if (!roleCheck.success) return roleCheck;

  return fuelExpenseService.deleteFuelEntry(id);
}

export async function getExpenses(vehicleId?: string): Promise<ServiceResult<ExpenseEntry[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.getExpenses(vehicleId);
}

export async function addExpense(entry: Omit<ExpenseEntry, "id">): Promise<ServiceResult<ExpenseEntry>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "expenses", "create");
  if (!roleCheck.success) return roleCheck;

  const parsed = createExpenseSchema.safeParse(entry);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return fuelExpenseService.addExpense(entry);
}

export async function updateExpense(id: string, updates: Partial<ExpenseEntry>): Promise<ServiceResult<ExpenseEntry>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "expenses", "update");
  if (!roleCheck.success) return roleCheck;

  const parsed = updateExpenseSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return fuelExpenseService.updateExpense(id, updates);
}

export async function deleteExpense(id: string): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "expenses", "delete");
  if (!roleCheck.success) return roleCheck;

  return fuelExpenseService.deleteExpense(id);
}

export async function getOperationalCost(
  vehicleId: string,
): Promise<ServiceResult<{ fuel: number; expenses: number; maintenance: number; total: number }>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return fuelExpenseService.getOperationalCost(vehicleId);
}
