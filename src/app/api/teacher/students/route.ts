import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

export async function GET() {
  const id = await teacherId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slot = await prisma.invigilationSlot.findFirst({
    where: { teacherUserId: id },
  });

  if (!slot) {
    return NextResponse.json({ students: [], needsAssignment: true });
  }

  const seats = await prisma.seatAssignment.findMany({
    where: { hallRoom: slot.hallRoom },
    include: {
      studentProfile: {
        include: { user: true },
      },
    },
    orderBy: { hallTicketNumber: "asc" },
  });

  const attendance = await prisma.attendanceRecord.findMany({
    where: { teacherUserId: id },
  });

  const attMap = new Map(attendance.map((a) => [a.studentUserId, a]));

  const students = seats.map((s) => {
    const u = s.studentProfile.user;
    const a = attMap.get(u.id);
    return {
      userId: u.id,
      usn: u.username,
      name: s.studentProfile.fullName,
      hallTicket: s.hallTicketNumber,
      hallRoom: s.hallRoom,
      // seatNumber removed from schema
      answerSheetCode: s.studentProfile.answerSheetCode,
      biometricId: s.studentProfile.biometricId ?? null,
      present: a?.present ?? false,
      scannedCode: a?.scannedCode ?? "",
      attendanceBiometricId: a?.biometricId ?? "",
      submitted: Boolean(a),
    };
  });

  return NextResponse.json({ students, hallRoom: slot.hallRoom, needsAssignment: false });
}
