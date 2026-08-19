/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { APP_VERSION, getEnvironmentConfig } from "@/lib/config/environment";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await safeVerifyIdToken(token);
    const role = (decoded.role as string) || "OSC_MANAGER";

    if (!["ADMIN", "SUPER_ADMIN", "OSC_MANAGER", "PLANNING_MANAGER", "GIS_OFFICER", "OSC_OFFICER", "PLANNING_OFFICER", "APPLICANT"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = getEnvironmentConfig();

    return NextResponse.json({
      systemName: "OSC SmartCheck AI — Majlis Perbandaran Langkawi Bandaraya Pelancongan",
      appVersion: APP_VERSION,
      buildCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local-build-v1.0.0",
      environment: config.env,
      firebaseProject: config.firebaseProjectId,
      ruleEngineVersion: "1.0.0 (DSL Deterministic)",
      aiPromptVersion: "1.0.0 (Gemini 2.5 Pro / Vertex AI)",
      reportTemplateVersion: "1.0.0 (PDF 1.7 SHA-256)",
      gisProjection: "EPSG:3375 (Cassini Kedah / RSO Malaya)",
      legalFramework: "Akta Perancangan Bandar dan Desa 1976 (Akta 172)",
      authority: "Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)",
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load system info" }, { status: 500 });
  }
}
