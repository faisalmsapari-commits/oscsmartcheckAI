import { NextRequest, NextResponse } from "next/server";
import { getStandardTemplates, createStandardTemplate } from "@/lib/comments/templateService";
import { StandardTemplateSchema } from "@/lib/validation/comments.schema";
import { safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoCommentTemplates } from "@/lib/seed/demoData";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await safeVerifyIdToken(token);

    if (!isCloudFirestoreConfigured()) {
      return NextResponse.json({ templates: getDemoCommentTemplates() });
    }

    const templates = await getStandardTemplates();
    return NextResponse.json({ templates });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan templat ulasan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "OSC_OFFICER";

    if (!["ADMIN", "SUPER_ADMIN", "OSC_OFFICER"].includes(userRole)) {
      return NextResponse.json({ error: "Akses pentadbir diperlukan." }, { status: 403 });
    }

    const body = await req.json();
    const validated = StandardTemplateSchema.parse(body);

    if (!isCloudFirestoreConfigured()) {
      const newTpl = {
        id: `tpl-${Date.now()}`,
        templateId: `tpl-${Date.now()}`,
        ...validated,
        version: 1,
        approvedBy: decodedToken.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ template: newTpl, message: "Templat berjaya dicipta." });
    }

    const template = await createStandardTemplate(
      {
        ...validated,
        version: 1,
        approvedBy: decodedToken.uid,
      },
      decodedToken.uid
    );

    return NextResponse.json({ template, message: "Templat berjaya dicipta." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mencipta templat";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
