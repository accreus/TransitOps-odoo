import { createAdminClient } from "@/lib/supabase/admin";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { ServiceResult } from "@/lib/types";
import type { Vehicle, VehicleStatus, VehicleType } from "@/types";

const supabase = createAdminClient();

/** Map frontend lowercase status to DB Title Case for queries */
function dbStatus(status: string): string {
  const map: Record<string, string> = {
    available: "Available", on_trip: "On Trip", in_shop: "In Shop", retired: "Retired",
    draft: "Draft", dispatched: "Dispatched", in_transit: "In Transit",
    completed: "Completed", cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

export async function getVehicles(filters?: {
  status?: VehicleStatus;
  region?: string;
  type?: VehicleType;
  available?: boolean;
}): Promise<ServiceResult<Vehicle[]>> {
  let query = supabase.from("vehicles").select("*").order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", dbStatus(filters.status));
  if (filters?.region) query = query.eq("region", filters.region);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.available) query = query.eq("status", "Available");

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<Vehicle>(data ?? []) };
}

export async function getVehicleById(id: string): Promise<ServiceResult<Vehicle>> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: "Vehicle not found" };
  return { success: true, data: mapRowsToCamelCase<Vehicle>([data])[0] };
}

export async function getAvailableVehicles(): Promise<ServiceResult<Vehicle[]>> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("status", "Available")
    .order("registration_number");

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<Vehicle>(data ?? []) };
}

export async function createVehicle(
  vehicle: Omit<Vehicle, "id">,
): Promise<ServiceResult<Vehicle>> {
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id")
    .eq("registration_number", vehicle.regNumber)
    .maybeSingle();

  if (existing) {
    return { success: false, error: `Vehicle with registration "${vehicle.regNumber}" already exists`, field: "regNumber" };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert(mapToSnakeCase(vehicle as Record<string, unknown>))
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<Vehicle>([data])[0] };
}

export async function updateVehicle(
  id: string,
  updates: Partial<Vehicle>,
): Promise<ServiceResult<Vehicle>> {
  if (updates.regNumber) {
    const { data: existing } = await supabase
      .from("vehicles")
      .select("id")
      .eq("registration_number", updates.regNumber)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `Registration "${updates.regNumber}" already exists`, field: "regNumber" };
    }
  }

  const { data, error } = await supabase
    .from("vehicles")
    .update(mapToSnakeCase(updates as Record<string, unknown>))
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowsToCamelCase<Vehicle>([data])[0] };
}

const ALLOWED_VEHICLE_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  available: ["on_trip", "in_shop", "retired"],
  on_trip: ["available", "in_shop"],
  in_shop: ["available", "retired"],
  retired: [],
};

export async function setVehicleStatus(
  id: string,
  newStatus: VehicleStatus,
): Promise<ServiceResult<Vehicle>> {
  const current = await getVehicleById(id);
  if (!current.success) return current;

  const allowed = ALLOWED_VEHICLE_TRANSITIONS[current.data.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot transition vehicle from "${current.data.status}" to "${newStatus}". Allowed: ${allowed.join(", ") || "none"}`,
    };
  }

  return updateVehicle(id, { status: newStatus } as Partial<Vehicle>);
}

export async function deleteVehicle(id: string): Promise<ServiceResult<void>> {
  const { data: activeTrips } = await supabase
    .from("trips")
    .select("id")
    .eq("vehicle_id", id)
    .in("status", ["Draft", "Dispatched"])
    .limit(1);

  if (activeTrips && activeTrips.length > 0) {
    return { success: false, error: "Cannot delete vehicle with active trips" };
  }

  const result = await updateVehicle(id, { status: "retired" } as Partial<Vehicle>);
  if (!result.success) return { success: false, error: result.error };
  return { success: true, data: undefined };
}

export async function getVehicleStats(): Promise<
  ServiceResult<{ total: number; available: number; onTrip: number; inShop: number; retired: number }>
> {
  const { data, error } = await supabase.from("vehicles").select("status");
  if (error) return { success: false, error: error.message };

  const stats = { total: 0, available: 0, onTrip: 0, inShop: 0, retired: 0 };
  for (const v of data ?? []) {
    stats.total++;
    switch (v.status) {
      case "Available": stats.available++; break;
      case "On Trip": stats.onTrip++; break;
      case "In Shop": stats.inShop++; break;
      case "Retired": stats.retired++; break;
    }
  }

  return { success: true, data: stats };
}
