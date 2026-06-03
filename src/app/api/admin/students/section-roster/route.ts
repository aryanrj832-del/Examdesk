import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const section = url.searchParams.get("section")?.trim();
  if (!section) {
    return NextResponse.json({ error: "Missing section query" }, { status: 400 });
  }

  const where = section === "Unassigned" ? { section: null } : { section };
  const students = await prisma.studentProfile.findMany({
    where,
    include: { user: true, seat: true },
    orderBy: [{ fullName: "asc" }],
  });

  const sheetRows = students.map((profile) => ({
    USN: profile.user.username,
    FullName: profile.fullName,
    Email: profile.user.email ?? "",
    Program: profile.program ?? "",
    Section: profile.section ?? "Unassigned",
    Phone: profile.phoneNumber ?? "",
    BiometricId: profile.biometricId ?? "",
    HallRoom: profile.seat?.hallRoom ?? "",
    SeatNumber: profile.seat?.seatNumber ?? "",
    HallTicketNumber: profile.seat?.hallTicketNumber ?? "",
    AnswerSheetCode: profile.answerSheetCode,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows, {
    header: [
      "USN",
      "FullName",
      "Email",
      "Program",
      "Section",
      "Phone",
      "BiometricId",
      "HallRoom",
      "SeatNumber",
      "HallTicketNumber",
      "AnswerSheetCode",
    ],
  });
  XLSX.utils.book_append_sheet(wb, ws, "Section roster");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `section-roster-${section.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase()}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
