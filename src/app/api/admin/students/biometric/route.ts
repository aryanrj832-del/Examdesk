import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ usn: z.string().min(1), biometricId: z.string().min(1) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { usn, biometricId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username: usn } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profile = await prisma.studentProfile.updateMany({
    where: { userId: user.id },
    data: { biometricId: biometricId.trim() || null },
  });

  if (profile.count === 0) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, usn, biometricId });
}
