import { createAdminClient } from "@/lib/supabase/admin";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { ServiceResult } from "@/lib/types";
import type { MaintenanceLog } from "@/types";

const supabase = createAdminClient();

export type MaintenanceLogWithVehicle = MaintenanceLog & {
  vehicleRegNumber?: string;
  vehicleModel?: string;
};

export async function getMaintenanceLogs(vehicleId?: string): Promise<ServiceResult<MaintenanceLogWithVehicle[]>> {
  let query = supabase
    .from("maintenance_logs")
    .select("*, vehicle:vehicles(registration_number, model)")
    .order("created_at", { ascending: false });

  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const rows = (data ?? []).map((row) => {
    const mapped = mapRowsToCamelCase<MaintenanceLog>([row])[0];
    const vehicle = row.vehicle as { registration_number: string; model: string } | null;
    return {
      ...mapped,
      vehicleRegNumber: vehicle?.registration_number,
      vehicleModel: vehicle?.model,
    };
  });

  return { success: true, data: rows };
}

export async function getMaintenanceLogById(id: string): Promise<ServiceResult<MaintenanceLogWithVehicle>> {
  const { data, error } = await supabase
    .from("maintenance_logs")
    .select("*, vehicle:vehicles(registration_number, model)")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: "Maintenance log not found" };

  const mapped = mapRowsToCamelCase<MaintenanceLog>([data])[0];
  const vehicle = data.vehicle as { registration_number: string; model: string } | null;
  return {
    success: true,
    data: {
      ...mapped,
      vehicleRegNumber: vehicle?.registration_number,
      vehicleModel: vehicle?.model,
    },
  };
}

export async function createMaintenanceLog(
  log: Omit<MaintenanceLog, "id">,
): Promise<ServiceResult<MaintenanceLog>> {
  // Validate vehicle exists and is not retired
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("status")
    .eq("id", log.vehicleId)
    .single();

  if (!vehicle) return { success: false, error: "Vehicle not found", field: "vehicleId" };
  if (vehicle.status === "retired") {
    return { success: false, error: "Cannot create maintenance for retired vehicle", field: "vehicleId" };
  }

  const dbRow = {
    ...mapToSnakeCase(log as Record<string, unknown>),
    state: log.status === "completed" ? "closed" : "open",
    date: log.date || new Date().toISOString().split("T")[0],
  };

  // DB trigger `maintenance_created_set_in_shop` will set vehicle status to "In Shop"
  const { data, error } = await supabase
    .from("maintenance_logs")
    .insert(dbRow)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<MaintenanceLog>([data])[0] };
}

export async function updateMaintenanceLog(
  id: string,
  updates: Partial<MaintenanceLog>,
): Promise<ServiceResult<MaintenanceLog>> {
  const dbUpdates: Record<string, unknown> = mapToSnakeCase(updates as Record<string, unknown>);

  // Map frontend status to DB state
  if (updates.status === "completed") dbUpdates.state = "closed";
  else if (updates.status === "in_progress" || updates.status === "scheduled") dbUpdates.state = "open";

  // DB trigger `maintenance_closed_restore_status` will restore vehicle to "Available"
  const { data, error } = await supabase
    .from("maintenance_logs")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<MaintenanceLog>([data])[0] };
}

export async function closeMaintenanceLog(id: string): Promise<ServiceResult<MaintenanceLog>> {
  return updateMaintenanceLog(id, { status: "completed" });
}

export async function deleteMaintenanceLog(id: string): Promise<ServiceResult<void>> {
  const { error } = await supabase.from("maintenance_logs").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function getMaintenanceStats(): Promise<
  ServiceResult<{
    totalLogs: number;
    openLogs: number;
    closedLogs: number;
    totalCost: number;
    vehiclesInShop: number;
  }>
> {
  const [{ data: allLogs, error: allError }, { data: openLogs, error: openError }] = await Promise.all([
    supabase.from("maintenance_logs").select("state, cost, vehicle_id"),
    supabase.from("maintenance_logs").select("vehicle_id").eq("state", "open"),
  ]);

  if (allError) return { success: false, error: allError.message };
  if (openError) return { success: false, error: openError.message };

  const all = allLogs ?? [];
  const open = openLogs ?? [];

  return {
    success: true,
    data: {
      totalLogs: all.length,
      openLogs: open.length,
      closedLogs: all.length - open.length,
      totalCost: all.reduce((sum, log) => sum + (Number(log.cost) || 0), 0),
      vehiclesInShop: new Set(open.map((l) => l.vehicle_id)).size,
    },
  };
}
