import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { seedDemoApplications } from "@/lib/seed/demoDataSeeder";

export async function POST() {
  try {
    const db = getAdminDb();
    const result = await seedDemoApplications(db);
    return NextResponse.json({
      success: true,
      message: `Berjaya menjana ${result.seededCount} data demo permohonan pelbagai kategori!`,
      applications: result.applications,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to seed demo data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getAdminDb();
    const result = await seedDemoApplications(db);
    return NextResponse.json({
      success: true,
      message: `Berjaya menjana ${result.seededCount} data demo permohonan pelbagai kategori!`,
      applications: result.applications,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to seed demo data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
