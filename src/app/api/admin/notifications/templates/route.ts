/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "@/lib/notifications/templates";
import { CreateNotificationTemplateSchema } from "@/lib/validation/workflow.schema";
import type { UserRole } from "@/types/common";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = (decoded.role || "APPLICANT") as UserRole;

    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const db = getAdminDb();
    const snap = await db.collection("notificationTemplates").get();
    const dbTemplates = snap.docs.map((d) => d.data());

    const templates = dbTemplates.length > 0 ? dbTemplates : Object.values(DEFAULT_NOTIFICATION_TEMPLATES);
    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = (decoded.role || "APPLICANT") as UserRole;

    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateNotificationTemplateSchema.parse(body);

    const db = getAdminDb();
    const tplRef = db.collection("notificationTemplates").doc(parsed.templateId);

    const templateData = {
      ...parsed,
      version: "1.0.0",
      status: "ACTIVE",
      updatedBy: decoded.uid,
      updatedAt: new Date().toISOString(),
    };

    await tplRef.set(templateData);
    return NextResponse.json({ success: true, template: templateData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save template" }, { status: 400 });
  }
}
