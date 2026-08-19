import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/config/environment";

export async function GET() {
  return NextResponse.json({
    status: "HEALTHY",
    service: "osc-smartcheck-ai",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
}
