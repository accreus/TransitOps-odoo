import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import type { FuelEntry, ExpenseEntry } from "@/types";

const supabase = createAdminClient();

export async function getFuelEntries(vehicleId?: string): Promise<ServiceResult<FuelEntry[]>> {
  let query = supabase.from("fuel_logs").select("*").order("date", { ascending: false });
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as FuelEntry[] };
}

export async function addFuelEntry(entry: Omit<FuelEntry, "id">): Promise<ServiceResult<FuelEntry>> {
  const { data, error } = await supabase
    .from("fuel_logs")
    .insert(entry)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as FuelEntry };
}

export async function getExpenses(vehicleId?: string): Promise<ServiceResult<ExpenseEntry[]>> {
  let query = supabase.from("expenses").select("*").order("date", { ascending: false });
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as ExpenseEntry[] };
}

export async function addExpense(entry: Omit<ExpenseEntry, "id">): Promise<ServiceResult<ExpenseEntry>> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(entry)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as ExpenseEntry };
}

export async function getOperationalCost(
  vehicleId: string,
): Promise<ServiceResult<{ fuel: number; expenses: number; maintenance: number; total: number }>> {
  const [fuelResult, expenseResult, maintenanceResult] = await Promise.all([
    supabase
      .from("fuel_logs")
      .select("total_cost")
      .eq("vehicle_id", vehicleId),
    supabase
      .from("expenses")
      .select("amount")
      .eq("vehicle_id", vehicleId),
    supabase
      .from("maintenance_logs")
      .select("cost")
      .eq("vehicle_id", vehicleId),
  ]);

  const fuel = (fuelResult.data ?? []).reduce((sum, e) => sum + (e.total_cost ?? 0), 0);
  const expenses = (expenseResult.data ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const maintenance = (maintenanceResult.data ?? []).reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return {
    success: true,
    data: { fuel, expenses, maintenance, total: fuel + expenses + maintenance },
  };
}
