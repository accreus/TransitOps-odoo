import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as driverService from "@/lib/services/driver-service";
import { updateDriverSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const result = await driverService.getDriverById(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result.data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const roleCheck = requireRole(auth.data.role, "drivers", "update");
  if (!roleCheck.success) {
    return NextResponse.json({ error: roleCheck.error }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") },
      { status: 400 },
    );
  }

  const result = await driverService.updateDriver(id, parsed.data);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const roleCheck = requireRole(auth.data.role, "drivers", "delete");
  if (!roleCheck.success) {
    return NextResponse.json({ error: roleCheck.error }, { status: 403 });
  }

  const result = await driverService.deleteDriver(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
