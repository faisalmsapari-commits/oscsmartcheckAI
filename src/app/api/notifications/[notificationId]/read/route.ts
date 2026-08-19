/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { markNotificationRead } from "@/lib/notifications/notificationService";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);

    const { notificationId } = await context.params;
    await markNotificationRead(notificationId, decoded.uid);

    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark notification read" }, { status: 500 });
  }
}
