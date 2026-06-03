import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession, COOKIE } from "@/lib/auth";

async function teacherId() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || session.role !== "TEACHER") return null;
  return session.sub;
}

const rowSchema = z.object({
  studentUserId: z.string().min(1),
  present: z.boolean(),
  scannedCode: z.string().optional().nullable(),
  biometricId: z.string().optional().nullable(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1),
});

export async function POST(req: Request) {
  const id = await teacherId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  for (const row of parsed.data.rows) {
    if (row.present && !row.biometricId?.trim()) {
      return NextResponse.json({ error: "Biometric scan is required for present students." }, { status: 400 });
    }
  }

  const slot = await prisma.invigilationSlot.findFirst({
    where: { teacherUserId: id },
  });

  if (!slot) {
    return NextResponse.json({ error: "Assign a hall first" }, { status: 400 });
  }

  const allowed = await prisma.seatAssignment.findMany({
    where: { hallRoom: slot.hallRoom },
    select: { studentProfile: { select: { userId: true } } },
  });
  const allowedIds = new Set(allowed.map((s) => s.studentProfile.userId));

  for (const row of parsed.data.rows) {
    if (!allowedIds.has(row.studentUserId)) {
      return NextResponse.json({ error: "Student not in your hall" }, { status: 400 });
    }
  }

  // fetch stored biometrics for students in this submission
  const studentIds = parsed.data.rows.map((r) => r.studentUserId);
  const profiles = await prisma.studentProfile.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, biometricId: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.userId, p.biometricId]));

  for (const row of parsed.data.rows) {
    if (row.present) {
      const stored = profileMap.get(row.studentUserId) ?? null;
      const submitted = row.biometricId?.trim() || null;
      if (!stored) {
        return NextResponse.json({ error: `KYC missing for student ${row.studentUserId}` }, { status: 400 });
      }
      if (stored !== submitted) {
        return NextResponse.json({ error: `Biometric mismatch for student ${row.studentUserId}` }, { status: 400 });
      }
    }
  }

  await prisma.$transaction(
    parsed.data.rows.map((row) =>
      prisma.attendanceRecord.upsert({
        where: {
          studentUserId_teacherUserId: {
            studentUserId: row.studentUserId,
            teacherUserId: id,
          },
        },
        create: {
          studentUserId: row.studentUserId,
          teacherUserId: id,
          present: row.present,
          scannedCode: row.scannedCode?.trim() || null,
          biometricId: row.biometricId?.trim() || null,
        },
        update: {
          present: row.present,
          scannedCode: row.scannedCode?.trim() || null,
          biometricId: row.biometricId?.trim() || null,
          submittedAt: new Date(),
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
