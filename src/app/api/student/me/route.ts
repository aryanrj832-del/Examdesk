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

export async function GET() {
  const id = await studentId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: { seat: true },
      },
    },
  });

  if (!user?.studentProfile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const seat = user.studentProfile.seat;

  return NextResponse.json({
    usn: user.username,
    fullName: user.studentProfile.fullName,
    email: user.email ?? "",
    profileImageUrl: normalizeImageUrl(user.studentProfile.profileImageUrl),
    program: user.studentProfile.program,
    section: user.studentProfile.section ?? null,
    phoneNumber: user.studentProfile.phoneNumber ?? null,
    biometricId: user.studentProfile.biometricId ?? null,
    hallTicketNumber: seat?.hallTicketNumber ?? null,
    hallRoom: seat?.hallRoom ?? null,
    seatNumber: seat?.seatNumber ?? null,
    answerSheetCode: user.studentProfile.answerSheetCode,
    hasSeat: Boolean(seat),
  });
}
