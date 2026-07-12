import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as reportService from "@/lib/services/report-service";

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      row
        .map((v) => {
          const s = String(v ?? "");
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
  }
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");

  let csv = "";
  let filename = "";

  switch (type) {
    case "utilization": {
      const result = await reportService.getFleetUtilization();
      if (!result.success) return new Response(result.error, { status: 500 });
      const { overall, byRegion } = result.data;
      const headers = ["Region", "Total Vehicles", "On Trip", "Utilization %"];
      const rows = [
        ["Overall", overall.active, overall.onTrip, overall.utilization],
        ...Object.entries(byRegion).map(([r, d]) => [r, d.total, d.onTrip, d.utilization]),
      ];
      csv = toCsv(headers, rows);
      filename = "fleet-utilization.csv";
      break;
    }
    case "fuel": {
      const result = await reportService.getFuelEfficiency();
      if (!result.success) return new Response(result.error, { status: 500 });
      const headers = ["Trip Number", "Vehicle ID", "km/L", "Distance (km)", "Fuel (L)"];
      const rows = result.data.map((d) => [d.tripNumber, d.vehicleId, d.kmPerLiter, d.distance, d.fuel]);
      csv = toCsv(headers, rows);
      filename = "fuel-efficiency.csv";
      break;
    }
    case "cost": {
      const result = await reportService.getOperationalCostPerVehicle();
      if (!result.success) return new Response(result.error, { status: 500 });
      const headers = ["Vehicle ID", "Reg Number", "Fuel ($)", "Expenses ($)", "Maintenance ($)", "Total ($)"];
      const rows = result.data.map((d) => [d.vehicleId, d.regNumber, d.fuel, d.expenses, d.maintenance, d.total]);
      csv = toCsv(headers, rows);
      filename = "operational-costs.csv";
      break;
    }
    case "roi": {
      const result = await reportService.getVehicleROI();
      if (!result.success) return new Response(result.error, { status: 500 });
      const headers = ["Vehicle ID", "Reg Number", "Revenue ($)", "Operational Cost ($)", "Acquisition Cost ($)", "ROI %"];
      const rows = result.data.map((d) => [d.vehicleId, d.regNumber, d.revenue, d.operationalCost, d.acquisitionCost, d.roi]);
      csv = toCsv(headers, rows);
      filename = "vehicle-roi.csv";
      break;
    }
    default:
      return new Response("Invalid type. Use: utilization, fuel, cost, roi", { status: 400 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
