"use server";

import { createClient } from "@/lib/supabase/server";
import * as reportService from "@/lib/services/report-service";
import type { ServiceResult } from "@/lib/types";

async function requireAuth(): Promise<ServiceResult<string>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { success: false, error: "Unauthorized" };
  return { success: true, data: user.id };
}

export async function getFleetUtilization() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getFleetUtilization();
}

export async function getFuelEfficiency() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getFuelEfficiency();
}

export async function getOperationalCostPerVehicle() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getOperationalCostPerVehicle();
}

export async function getVehicleROI() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getVehicleROI();
}
