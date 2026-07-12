import { createAdminClient } from "@/lib/supabase/admin";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { ServiceResult } from "@/lib/types";
import type { FuelEntry, ExpenseEntry } from "@/types";

const supabase = createAdminClient();

// ─── Fuel Entries ─────────────────────────────────────────────────────────────

export async function getFuelEntries(vehicleId?: string): Promise<ServiceResult<FuelEntry[]>> {
  let query = supabase.from("fuel_logs").select("*").order("date", { ascending: false });
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<FuelEntry>(data ?? []) };
}

export async function addFuelEntry(entry: Omit<FuelEntry, "id">): Promise<ServiceResult<FuelEntry>> {
  const { data, error } = await supabase
    .from("fuel_logs")
    .insert(mapToSnakeCase(entry as Record<string, unknown>))
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<FuelEntry>([data])[0] };
}

export async function updateFuelEntry(id: string, updates: Partial<FuelEntry>): Promise<ServiceResult<FuelEntry>> {
  const { data, error } = await supabase
    .from("fuel_logs")
    .update(mapToSnakeCase(updates as Record<string, unknown>))
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<FuelEntry>([data])[0] };
}

export async function deleteFuelEntry(id: string): Promise<ServiceResult<void>> {
  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(vehicleId?: string): Promise<ServiceResult<ExpenseEntry[]>> {
  let query = supabase.from("expenses").select("*").order("date", { ascending: false });
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<ExpenseEntry>(data ?? []) };
}

export async function addExpense(entry: Omit<ExpenseEntry, "id">): Promise<ServiceResult<ExpenseEntry>> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(mapToSnakeCase(entry as Record<string, unknown>))
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<ExpenseEntry>([data])[0] };
}

export async function updateExpense(id: string, updates: Partial<ExpenseEntry>): Promise<ServiceResult<ExpenseEntry>> {
  const { data, error } = await supabase
    .from("expenses")
    .update(mapToSnakeCase(updates as Record<string, unknown>))
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<ExpenseEntry>([data])[0] };
}

export async function deleteExpense(id: string): Promise<ServiceResult<void>> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ─── Cost Aggregation ─────────────────────────────────────────────────────────

export async function getOperationalCost(
  vehicleId: string,
): Promise<ServiceResult<{ fuel: number; expenses: number; maintenance: number; total: number }>> {
  const [fuelResult, expenseResult, maintenanceResult] = await Promise.all([
    supabase.from("fuel_logs").select("cost").eq("vehicle_id", vehicleId),
    supabase.from("expenses").select("cost").eq("vehicle_id", vehicleId),
    supabase.from("maintenance_logs").select("cost").eq("vehicle_id", vehicleId),
  ]);

  const fuel = (fuelResult.data ?? []).reduce((sum: number, e: { cost: number }) => sum + (Number(e.cost) ?? 0), 0);
  const expenses = (expenseResult.data ?? []).reduce((sum: number, e: { cost: number }) => sum + (Number(e.cost) ?? 0), 0);
  const maintenance = (maintenanceResult.data ?? []).reduce((sum: number, e: { cost: number }) => sum + (Number(e.cost) ?? 0), 0);

  return {
    success: true,
    data: { fuel, expenses, maintenance, total: fuel + expenses + maintenance },
  };
}
