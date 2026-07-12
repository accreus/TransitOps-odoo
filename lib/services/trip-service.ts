import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import type { Trip, TripStatus } from "@/types";

const supabase = createAdminClient();

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
  return { success: true, data: data as Trip[] };
}

export async function getTripById(
  id: string,
): Promise<ServiceResult<Trip>> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Trip };
}

export async function createTrip(
  trip: Omit<Trip, "id" | "tripNumber" | "createdAt" | "status">,
): Promise<ServiceResult<Trip>> {
  const tripNumber = `TMP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      ...trip,
      trip_number: tripNumber,
      status: "draft",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Trip };
}

export async function dispatchTrip(
  id: string,
): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !trip) return { success: false, error: "Trip not found" };
  if (trip.status !== "draft") {
    return { success: false, error: "Only draft trips can be dispatched" };
  }

  const { error } = await supabase.rpc("dispatch_trip", {
    p_trip_id: id,
  });

  if (error) return { success: false, error: error.message };

  const { data: updated, error: refetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (refetchError) return { success: false, error: refetchError.message };
  return { success: true, data: updated as Trip };
}

export async function departTrip(
  id: string,
): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !trip) return { success: false, error: "Trip not found" };
  if (trip.status !== "dispatched") {
    return { success: false, error: "Only dispatched trips can depart" };
  }

  const { error } = await supabase.rpc("depart_trip", {
    p_trip_id: id,
  });

  if (error) return { success: false, error: error.message };

  const { data: updated, error: refetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (refetchError) return { success: false, error: refetchError.message };
  return { success: true, data: updated as Trip };
}

export async function completeTrip(
  id: string,
  revenue: number,
  fuelUsedLiters: number,
): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !trip) return { success: false, error: "Trip not found" };
  if (trip.status !== "in_transit" && trip.status !== "dispatched") {
    return {
      success: false,
      error: "Only dispatched or in-transit trips can be completed",
    };
  }

  const { error } = await supabase.rpc("complete_trip", {
    p_trip_id: id,
    p_revenue: revenue,
    p_fuel_used: fuelUsedLiters,
  });

  if (error) return { success: false, error: error.message };

  const { data: updated, error: refetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (refetchError) return { success: false, error: refetchError.message };
  return { success: true, data: updated as Trip };
}

export async function cancelTrip(
  id: string,
): Promise<ServiceResult<Trip>> {
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !trip) return { success: false, error: "Trip not found" };
  if (trip.status === "completed" || trip.status === "cancelled") {
    return { success: false, error: "Cannot cancel a completed or cancelled trip" };
  }

  const { error } = await supabase.rpc("cancel_trip", {
    p_trip_id: id,
  });

  if (error) return { success: false, error: error.message };

  const { data: updated, error: refetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (refetchError) return { success: false, error: refetchError.message };
  return { success: true, data: updated as Trip };
}

export async function deleteTrip(
  id: string,
): Promise<ServiceResult<void>> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
