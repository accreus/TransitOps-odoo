import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import type { Driver, DriverStatus } from "@/types";

const supabase = createAdminClient();

export async function getDrivers(filters?: {
  status?: DriverStatus;
  region?: string;
}): Promise<ServiceResult<Driver[]>> {
  let query = supabase.from("drivers").select("*").order("name");

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.region) query = query.eq("region", filters.region);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Driver[] };
}

export async function getDriverById(
  id: string,
): Promise<ServiceResult<Driver>> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Driver };
}

export async function getAvailableDrivers(): Promise<ServiceResult<Driver[]>> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .neq("status", "suspended")
    .neq("status", "on_trip")
    .gt("license_expiry", today)
    .order("name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Driver[] };
}

export async function createDriver(
  driver: Omit<Driver, "id">,
): Promise<ServiceResult<Driver>> {
  const { data, error } = await supabase
    .from("drivers")
    .insert(driver)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Driver };
}

export async function updateDriver(
  id: string,
  updates: Partial<Driver>,
): Promise<ServiceResult<Driver>> {
  const { data, error } = await supabase
    .from("drivers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Driver };
}

export async function deleteDriver(
  id: string,
): Promise<ServiceResult<void>> {
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
