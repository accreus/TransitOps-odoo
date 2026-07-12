import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as tripService from "@/lib/services/trip-service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const roleCheck = requireRole(auth.data.role, "trips", "update");
  if (!roleCheck.success) {
    return NextResponse.json({ error: roleCheck.error }, { status: 403 });
  }

  const result = await tripService.dispatchTrip(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
