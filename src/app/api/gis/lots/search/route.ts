import { NextRequest, NextResponse } from "next/server";
import { searchLots } from "@/lib/gis/spatialService";
import { LotSearchRequestSchema } from "@/lib/validation/gis.schema";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    await getAuth().verifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const rawParams = {
      lotNumber: searchParams.get("lotNumber") || undefined,
      mukim: searchParams.get("mukim") || undefined,
      district: searchParams.get("district") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const validated = LotSearchRequestSchema.parse(rawParams);
    const lots = await searchLots(validated);

    return NextResponse.json({ lots, count: lots.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat carian lot kadaster";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
