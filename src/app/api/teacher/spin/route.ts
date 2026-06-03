import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, COOKIE } from "@/lib/auth";

async function requireTeacherId() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || session.role !== "TEACHER") return null;
  return session.sub;
}

function normalizeLabel(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function POST() {
  const teacherUserId = await requireTeacherId();
  if (!teacherUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.user.findUnique({
    where: { id: teacherUserId },
    include: { teacherProfile: true },
  });

  if (!teacher?.teacherProfile) {
    return NextResponse.json({ error: "Teacher profile missing" }, { status: 400 });
  }

  const existing = await prisma.invigilationSlot.findFirst({
    where: { teacherUserId },
  });

  if (existing) {
    return NextResponse.json({ hallRoom: existing.hallRoom, alreadyAssigned: true });
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const open = await tx.invigilationSlot.findMany({
      where: { teacherUserId: null },
    });

    if (open.length === 0) return null;

    const pick = open[Math.floor(Math.random() * open.length)];

    const updated = await tx.invigilationSlot.updateMany({
      where: { id: pick.id, teacherUserId: null },
      data: { teacherUserId, claimedAt: new Date() },
    });

    if (updated.count === 0) {
      return null;
    }

    return pick.hallRoom;
  });

  if (!claimed) {
    return NextResponse.json(
      { error: "No halls are available to assign right now." },
      { status: 409 }
    );
  }

  return NextResponse.json({ hallRoom: claimed, alreadyAssigned: false });
}
