import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const start = Date.now();

  try {
    const supabase = await createClient();

    // Verify Supabase connectivity by querying a lightweight row
    const { error } = await supabase.from("users").select("id").limit(1);

    const latencyMs = Date.now() - start;

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "healthy",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const latencyMs = Date.now() - start;
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Internal error",
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
