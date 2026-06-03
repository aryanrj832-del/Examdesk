import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, COOKIE } from "@/lib/auth";
import { normalizeImageUrl } from "@/lib/image-url";

async function teacherId() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || session.role !== "TEACHER") return null;
  return session.sub;
}

export async function GET() {
  const id = await teacherId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id },
    include: { teacherProfile: true },
  });

  if (!user?.teacherProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const slot = await prisma.invigilationSlot.findFirst({
    where: { teacherUserId: id },
  });

  return NextResponse.json({
    profile: {
      fullName: user.teacherProfile.fullName,
      department: user.teacherProfile.department,
      imageUrl: normalizeImageUrl(user.teacherProfile.profileImageUrl),
    },
    hallRoom: slot?.hallRoom ?? null,
  });
}
