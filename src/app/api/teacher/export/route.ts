import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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
    return NextResponse.json({ error: "No hall assigned" }, { status: 400 });
  }

  const seats = await prisma.seatAssignment.findMany({
    where: { hallRoom: slot.hallRoom },
    include: {
      studentProfile: { include: { user: true } },
    },
    orderBy: { hallTicketNumber: "asc" },
  });

  const attendance = await prisma.attendanceRecord.findMany({
    where: { teacherUserId: id },
  });
  const attMap = new Map(attendance.map((a) => [a.studentUserId, a]));

  const sheetRows = seats.map((s) => {
    const u = s.studentProfile.user;
    const a = attMap.get(u.id);
    return {
      USN: u.username,
      Name: s.studentProfile.fullName,
      HallRoom: s.hallRoom,
      HallTicket: s.hallTicketNumber,
      AnswerSheetBarcode: s.studentProfile.answerSheetCode,
      Present: a?.present ? "Yes" : "No",
      ScannedValue: a?.scannedCode ?? "",
      SubmittedBiometric: a?.biometricId ?? "",
      StoredBiometric: s.studentProfile.biometricId ?? "",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `attendance-${slot.hallRoom.replace(/[^a-z0-9-_]+/gi, "_")}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
