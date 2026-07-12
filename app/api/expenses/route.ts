import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as fuelExpenseService from "@/lib/services/fuel-expense-service";
import { createExpenseSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  const result = await fuelExpenseService.getExpenses(vehicleId ?? undefined);

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

  const roleCheck = requireRole(auth.data.role, "expenses", "create");
  if (!roleCheck.success) {
    return NextResponse.json({ error: roleCheck.error }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") },
      { status: 400 },
    );
  }

  const result = await fuelExpenseService.addExpense(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data, { status: 201 });
}
