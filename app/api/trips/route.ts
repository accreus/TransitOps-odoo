import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as tripService from "@/lib/services/trip-service";
import { createTripSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const vehicleId = searchParams.get("vehicleId");
  const driverId = searchParams.get("driverId");

  const result = await tripService.getTrips({
    status: status ?? undefined,
    vehicleId: vehicleId ?? undefined,
    driverId: driverId ?? undefined,
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

  const body = await request.json();
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") },
      { status: 400 },
    );
  }

  const result = await tripService.createTrip(parsed.data as never);
  if (!result.success) {
    return NextResponse.json({ error: result.error, field: result.field }, { status: 400 });
  }
  return NextResponse.json(result.data, { status: 201 });
}
