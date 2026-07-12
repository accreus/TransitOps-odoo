import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as vehicleService from "@/lib/services/vehicle-service";
import { createVehicleSchema } from "@/lib/validation";
import type { VehicleStatus } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const availableOnly = searchParams.get("available") === "true";
  const status = searchParams.get("status");
  const region = searchParams.get("region");

  const result = await vehicleService.getVehicles({
    available: availableOnly || undefined,
    status: (status as VehicleStatus) ?? undefined,
    region: region ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const roleCheck = requireRole(auth.data.role, "vehicles", "create");
  if (!roleCheck.success) {
    return NextResponse.json({ error: roleCheck.error }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") },
      { status: 400 },
    );
  }

  const result = await vehicleService.createVehicle(parsed.data as never);
  if (!result.success) {
    const status = result.error.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: result.error, field: result.field }, { status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
