import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_AGENCY_BRANDING, AgencyBrandingConfig } from "@/types/branding";

let inMemoryBranding: AgencyBrandingConfig = { ...DEFAULT_AGENCY_BRANDING };

export async function GET() {
  return NextResponse.json({
    success: true,
    branding: inMemoryBranding,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    inMemoryBranding = {
      ...inMemoryBranding,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: "Pentadbir Sistem Utama",
    };

    return NextResponse.json({
      success: true,
      branding: inMemoryBranding,
      message: "Branding agensi berjaya dikemas kini.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat mengemas kini branding agensi";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
