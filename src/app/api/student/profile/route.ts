import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, COOKIE } from "@/lib/auth";
import { normalizeImageUrl } from "@/lib/image-url";

async function studentId() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || session.role !== "STUDENT") return null;
  return session.sub;
}

export async function POST(req: Request) {
  const id = await studentId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const profileImageUrl = typeof json?.profileImageUrl === "string" ? json.profileImageUrl.trim() : null;
  if (profileImageUrl === null) {
    return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, include: { studentProfile: true } });
  if (!user?.studentProfile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const normalizedUrl = normalizeImageUrl(profileImageUrl || "");

  await prisma.studentProfile.update({
    where: { id: user.studentProfile.id },
    data: { profileImageUrl: normalizedUrl === "/default-avatar.svg" ? null : normalizedUrl },
  });

  return NextResponse.json({ ok: true, profileImageUrl: normalizedUrl });
}
