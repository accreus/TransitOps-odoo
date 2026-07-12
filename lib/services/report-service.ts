import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";

const supabase = createAdminClient();

/**
 * Note: The DB stores status as Title Case ("Completed"), but some queries
 * below use the DB column directly. The eq() calls here use Title Case to
 * match the DB CHECK constraint.
 */

export async function getFleetUtilization(): Promise<
  ServiceResult<{
    overall: { active: number; onTrip: number; inShop: number; retired: number; utilization: number };
    byRegion: Record<string, { total: number; onTrip: number; utilization: number }>;
  }>
> {
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("status,region");

  if (error) return { success: false, error: error.message };

  const all = vehicles as { status: string; region: string }[];
  const active = all.filter((v) => v.status !== "Retired").length;
  const onTrip = all.filter((v) => v.status === "On Trip").length;
  const inShop = all.filter((v) => v.status === "In Shop").length;
  const retired = all.filter((v) => v.status === "Retired").length;
  const utilization = active > 0 ? Math.round((onTrip / active) * 100) : 0;

  const byRegion: Record<string, { total: number; onTrip: number; utilization: number }> = {};
  all.forEach((v) => {
    if (!byRegion[v.region]) byRegion[v.region] = { total: 0, onTrip: 0, utilization: 0 };
    byRegion[v.region].total += 1;
    if (v.status === "On Trip") byRegion[v.region].onTrip += 1;
  });
  Object.keys(byRegion).forEach((r) => {
    const regionActive = all.filter((v) => v.region === r && v.status !== "Retired").length;
    byRegion[r].utilization =
      regionActive > 0 ? Math.round((byRegion[r].onTrip / regionActive) * 100) : 0;
  });

  return {
    success: true,
    data: { overall: { active, onTrip, inShop, retired, utilization }, byRegion },
  };
}

export async function getFuelEfficiency(): Promise<
  ServiceResult<Array<{ tripNumber: string; vehicleId: string; kmPerLiter: number; distance: number; fuel: number }>>
> {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("trip_number,vehicle_id,planned_distance,fuel_used_liters")
    .eq("status", "Completed")
    .gt("fuel_used_liters", 0);

  if (error) return { success: false, error: error.message };

  const data = (trips ?? []).map((t: Record<string, unknown>) => ({
    tripNumber: t.trip_number as string,
    vehicleId: t.vehicle_id as string,
    kmPerLiter: (t.fuel_used_liters as number) > 0
      ? Math.round(((t.planned_distance as number) / (t.fuel_used_liters as number)) * 100) / 100
      : 0,
    distance: t.planned_distance as number,
    fuel: t.fuel_used_liters as number,
  }));

  return { success: true, data };
}

export async function getOperationalCostPerVehicle(): Promise<
  ServiceResult<Array<{ vehicleId: string; regNumber: string; fuel: number; expenses: number; maintenance: number; total: number }>>
> {
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id,registration_number");

  if (vErr) return { success: false, error: vErr.message };

  const results = await Promise.all(
    (vehicles ?? []).map(async (v: { id: string; registration_number: string }) => {
      const [fuelR, expR, maintR] = await Promise.all([
        supabase.from("fuel_logs").select("cost").eq("vehicle_id", v.id),
        supabase.from("expenses").select("cost").eq("vehicle_id", v.id),
        supabase.from("maintenance_logs").select("cost").eq("vehicle_id", v.id),
      ]);

      const fuel = (fuelR.data ?? []).reduce((s: number, e: { cost: number }) => s + (Number(e.cost) ?? 0), 0);
      const expenses = (expR.data ?? []).reduce((s: number, e: { cost: number }) => s + (Number(e.cost) ?? 0), 0);
      const maintenance = (maintR.data ?? []).reduce((s: number, e: { cost: number }) => s + (Number(e.cost) ?? 0), 0);

      return {
        vehicleId: v.id,
        regNumber: v.registration_number,
        fuel,
        expenses,
        maintenance,
        total: fuel + expenses + maintenance,
      };
    }),
  );

  return { success: true, data: results };
}

export async function getVehicleROI(): Promise<
  ServiceResult<Array<{ vehicleId: string; regNumber: string; revenue: number; operationalCost: number; acquisitionCost: number; roi: number }>>
> {
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id,registration_number,acquisition_cost");

  if (vErr) return { success: false, error: vErr.message };

  const results = await Promise.all(
    (vehicles ?? []).map(async (v: { id: string; registration_number: string; acquisition_cost: number }) => {
      const [revenueR, opCostR] = await Promise.all([
        supabase.from("trips").select("revenue").eq("vehicle_id", v.id).eq("status", "Completed"),
        import("@/lib/services/fuel-expense-service").then((m) =>
          m.getOperationalCost(v.id),
        ),
      ]);

      const revenue = (revenueR.data ?? []).reduce((s: number, t: { revenue: number }) => s + (Number(t.revenue) ?? 0), 0);
      const opCost = opCostR.success ? opCostR.data.total : 0;
      const acqCost = Number(v.acquisition_cost) ?? 0;
      const roi = acqCost > 0 ? Math.round(((revenue - opCost) / acqCost) * 10000) / 100 : 0;

      return {
        vehicleId: v.id,
        regNumber: v.registration_number,
        revenue,
        operationalCost: opCost,
        acquisitionCost: acqCost,
        roi,
      };
    }),
  );

  return { success: true, data: results };
}
