import { NextResponse } from "next/server";
import { client } from "@/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unhealthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    const result = await client`SELECT 1 as ping`;
    dbLatencyMs = Date.now() - dbStart;
    if (result && result.length > 0) {
      dbStatus = "healthy";
    }
  } catch (dbErr: any) {
    logger.error("Health check DB query failed", dbErr, { route: "/api/health" });
    dbStatus = "degraded";
  }

  const totalTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === "healthy";

  const responseBody = {
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    subsystems: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      app: {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        responseTimeMs: totalTimeMs,
      },
    },
  };

  return NextResponse.json(
    responseBody,
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
