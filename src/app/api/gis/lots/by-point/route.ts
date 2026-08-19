import { NextRequest, NextResponse } from "next/server";
import { findLotByPoint } from "@/lib/gis/spatialService";
import { PointToLotRequestSchema } from "@/lib/validation/gis.schema";
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
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    const validated = PointToLotRequestSchema.parse({ latitude: lat, longitude: lng });
    const result = await findLotByPoint(validated.latitude, validated.longitude);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pemadanan titik ke lot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
