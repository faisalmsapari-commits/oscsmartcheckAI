import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { generateApplicationLayoutPlan } from "@/lib/gis/layoutPlanProvider";
import { getDemoApplication } from "@/lib/seed/demoDataSeeder";
import { getApplicationSite } from "@/lib/gis/spatialService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await safeVerifyIdToken(token);

    const { applicationId } = await params;

    // Check demo or live app
    const demo = getDemoApplication(applicationId);
    let lat = demo ? demo.latitude : 6.3268;
    let lng = demo ? demo.longitude : 99.8432;
    let siteAreaSqm = demo ? demo.siteAreaSqm : 20000;
    let lotNo = demo ? demo.lotNo : "Lot 145";
    let mukim = demo ? demo.mukim : "Kuah";
    const developmentType = demo ? demo.developmentType : "HOUSING";
    const projectTitle = demo ? demo.title : "Cadangan Pemajuan Kebenaran Merancang";

    try {
      const site = await getApplicationSite(applicationId);
      if (site) {
        if (site.latitude) lat = site.latitude;
        if (site.longitude) lng = site.longitude;
        if (site.cadastralAreaSqm) siteAreaSqm = site.cadastralAreaSqm;
        if (site.lotNumbers && site.lotNumbers.length > 0) lotNo = site.lotNumbers[0];
        if (site.mukim) mukim = site.mukim;
      }
    } catch {
      // Fallback
    }

    const layoutPlan = generateApplicationLayoutPlan({
      applicationId,
      lat,
      lng,
      siteAreaSqm,
      lotNo,
      mukim,
      developmentType,
      projectTitle,
    });

    return NextResponse.json({ layoutPlan });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan pelan tatatur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
