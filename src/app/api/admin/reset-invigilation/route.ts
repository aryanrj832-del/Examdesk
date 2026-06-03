import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.invigilationSlot.updateMany({
    data: { teacherUserId: null, claimedAt: null },
  });
  return NextResponse.json({ ok: true });
}
