/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { getNotifications, markAllNotificationsRead } from "@/lib/notifications/notificationService";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await safeVerifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await getNotifications(decoded.uid, unreadOnly);
    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await safeVerifyIdToken(token);

    await markAllNotificationsRead(decoded.uid);
    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark notifications read" }, { status: 500 });
  }
}
