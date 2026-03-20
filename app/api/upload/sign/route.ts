import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSignedUploadUrl } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["instructor", "admin"].includes(role))
    return NextResponse.json({ error: "Instructor access required" }, { status: 403 });

  const { folder, resourceType } = await req.json();
  const allowed = ["jlearn/thumbnails", "jlearn/videos", "jlearn/attachments", "jlearn/avatars"];
  if (!allowed.includes(folder))
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });

  try {
    const data = await getSignedUploadUrl({ folder, resourceType });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to sign upload" }, { status: 500 });
  }
}
