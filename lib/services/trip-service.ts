import { createAdminClient } from "@/lib/supabase/admin";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { ServiceResult } from "@/lib/types";
import type { Trip, TripStatus } from "@/types";

const supabase = createAdminClient();

/**
 * Trip state machine (DB stores Title Case):
 *   Draft → Dispatched → (departed) → Completed
 *   Draft → Cancelled
 *   Dispatched → Cancelled
 *
 * The DB CHECK constraint: status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')
 * Frontend types use snake_case: "draft", "dispatched", "in_transit", "completed", "cancelled"
 */

// Map DB title-case status to frontend snake_case status
function toFrontendStatus(dbStatus: string): TripStatus {
  const map: Record<string, TripStatus> = {
    Draft: "draft",
    Dispatched: "dispatched",
    Completed: "completed",
    Cancelled: "cancelled",
  };
  return map[dbStatus] ?? (dbStatus as TripStatus);
}

// Allowed transitions (using DB title-case)
const ALLOWED_TRIP_TRANSITIONS: Record<string, string[]> = {
  Draft: ["Dispatched", "Cancelled"],
  Dispatched: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export async function getTrips(filters?: {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
}): Promise<ServiceResult<Trip[]>> {
  let query = supabase.from("trips").select("*").order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);
  if (filters?.driverId) query = query.eq("driver_id", filters.driverId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  // Normalize statuses to frontend format
  const trips = (data ?? []).map((row) => {
    const mapped = mapRowsToCamelCase<Trip>([row])[0];
    mapped.status = toFrontendStatus(row.status);
    return mapped;
  });

  return { success: true, data: trips };
}

export async function getTripById(id: string): Promise<ServiceResult<Trip>> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: "Trip not found" };

  const mapped = mapRowsToCamelCase<Trip>([data])[0];
  mapped.status = toFrontendStatus(data.status);
  return { success: true, data: mapped };
}

/** Fetch raw trip with DB status for internal state machine checks */
async function getRawTrip(id: string): Promise<{ data: Record<string, unknown>; error: string | null }> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return { data: {}, error: "Trip not found" };
  return { data, error: null };
}

function canTransition(from: string, to: string): boolean {
  return (ALLOWED_TRIP_TRANSITIONS[from] ?? []).includes(to);
}

/** Generate a unique trip code */
function generateTripNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `TRIP-${year}-${rand}`;
}

export async function createTrip(
  trip: Omit<Trip, "id" | "tripNumber" | "createdAt" | "status">,
): Promise<ServiceResult<Trip>> {
  // Validate vehicle is available
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("status")
    .eq("id", trip.vehicleId)
    .single();

  if (!vehicle) return { success: false, error: "Vehicle not found", field: "vehicleId" };
  if (vehicle.status !== "Available" && vehicle.status !== "available") {
    return { success: false, error: "Vehicle is not available for dispatch", field: "vehicleId" };
  }

  // Validate driver is available
  const { data: driver } = await supabase
    .from("drivers")
    .select("status, license_expiry")
    .eq("id", trip.driverId)
    .single();

  if (!driver) return { success: false, error: "Driver not found", field: "driverId" };
  if (driver.status !== "Available" && driver.status !== "available") {
    return { success: false, error: "Driver is not available", field: "driverId" };
  }

  // Check license expiry
  if (driver.license_expiry && new Date(driver.license_expiry) < new Date()) {
    return { success: false, error: "Driver's license has expired", field: "driverId" };
  }

  const dbRow = {
    ...mapToSnakeCase(trip as Record<string, unknown>),
    trip_number: generateTripNumber(),
    status: "Draft",
  };

  const { data, error } = await supabase
    .from("trips")
    .insert(dbRow)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const mapped = mapRowsToCamelCase<Trip>([data])[0];
  mapped.status = toFrontendStatus(data.status);
  return { success: true, data: mapped };
}

export async function dispatchTrip(id: string): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await getRawTrip(id);
  if (fetchError) return { success: false, error: fetchError };

  const dbStatus = trip.status as string;
  if (!canTransition(dbStatus, "Dispatched")) {
    return { success: false, error: `Cannot dispatch trip in "${toFrontendStatus(dbStatus)}" status. Must be draft.` };
  }

  // Verify vehicle and driver are still available
  const vehicleId = trip.vehicle_id as string;
  const driverId = trip.driver_id as string;

  const [{ data: vehicle }, { data: driver }] = await Promise.all([
    supabase.from("vehicles").select("status").eq("id", vehicleId).single(),
    supabase.from("drivers").select("status").eq("id", driverId).single(),
  ]);

  if (vehicle && vehicle.status !== "Available" && vehicle.status !== "available") {
    return { success: false, error: "Vehicle is no longer available" };
  }
  if (driver && driver.status !== "Available" && driver.status !== "available") {
    return { success: false, error: "Driver is no longer available" };
  }

  const { error } = await supabase.rpc("dispatch_trip", { p_trip_id: id });
  if (error) return { success: false, error: error.message };

  return getTripById(id);
}

export async function departTrip(id: string): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await getRawTrip(id);
  if (fetchError) return { success: false, error: fetchError };

  const dbStatus = trip.status as string;
  if (!canTransition(dbStatus, "Completed") && dbStatus !== "Dispatched") {
    return { success: false, error: `Cannot depart trip in "${toFrontendStatus(dbStatus)}" status` };
  }
  if (dbStatus !== "Dispatched") {
    return { success: false, error: "Only dispatched trips can depart" };
  }

  const { error } = await supabase.rpc("depart_trip", { p_trip_id: id });
  if (error) return { success: false, error: error.message };

  return getTripById(id);
}

export async function completeTrip(
  id: string,
  revenue: number,
  fuelUsedLiters: number,
): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await getRawTrip(id);
  if (fetchError) return { success: false, error: fetchError };

  const dbStatus = trip.status as string;
  if (!canTransition(dbStatus, "Completed")) {
    return {
      success: false,
      error: `Cannot complete trip in "${toFrontendStatus(dbStatus)}" status. Must be dispatched.`,
    };
  }

  const { error } = await supabase.rpc("complete_trip", {
    p_trip_id: id,
    p_revenue: revenue,
    p_fuel_used: fuelUsedLiters,
  });
  if (error) return { success: false, error: error.message };

  return getTripById(id);
}

export async function cancelTrip(id: string): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await getRawTrip(id);
  if (fetchError) return { success: false, error: fetchError };

  const dbStatus = trip.status as string;
  if (!canTransition(dbStatus, "Cancelled")) {
    return {
      success: false,
      error: `Cannot cancel trip in "${toFrontendStatus(dbStatus)}" status. Only draft or dispatched trips can be cancelled.`,
    };
  }

  const { error } = await supabase.rpc("cancel_trip", { p_trip_id: id });
  if (error) return { success: false, error: error.message };

  return getTripById(id);
}

export async function updateTrip(
  id: string,
  updates: Partial<Trip>,
): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await getRawTrip(id);
  if (fetchError) return { success: false, error: fetchError };

  const dbStatus = trip.status as string;
  // Only draft trips can be edited
  if (dbStatus !== "Draft") {
    return { success: false, error: "Only draft trips can be edited" };
  }

  const snakeUpdates = mapToSnakeCase(updates as Record<string, unknown>);
  delete snakeUpdates.status; // Never allow direct status mutation
  delete snakeUpdates.trip_number; // Never allow trip number mutation

  const { data, error } = await supabase
    .from("trips")
    .update(snakeUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const mapped = mapRowsToCamelCase<Trip>([data])[0];
  mapped.status = toFrontendStatus(data.status);
  return { success: true, data: mapped };
}

export async function deleteTrip(id: string): Promise<ServiceResult<void>> {
  const { data: trip, error: fetchError } = await getRawTrip(id);
  if (fetchError) return { success: false, error: fetchError };

  const dbStatus = trip.status as string;
  if (dbStatus === "Dispatched" || dbStatus === "Completed") {
    return { success: false, error: "Cannot delete dispatched or completed trips" };
  }

  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
