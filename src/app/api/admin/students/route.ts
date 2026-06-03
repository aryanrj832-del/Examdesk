import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { normalizeImageUrl } from "@/lib/image-url";

const bodySchema = z.object({
  usn: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  program: z.string().optional(),
  section: z.string().optional(),
  phoneNumber: z.string().optional(),
  biometricId: z.string().min(1),
  hallRoom: z.string().optional(),
  seatNumber: z.string().optional(),
  hallTicket: z.string().optional(),
  barcode: z.string().optional(),
  profileImageUrl: z.string().optional(),
  password: z.string().min(4).default("demo123"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload. Email, USN, and biometric scan are required." }, { status: 400 });
  }

  const { usn, fullName, email, program, section, phoneNumber, biometricId, hallRoom, seatNumber, hallTicket, barcode, profileImageUrl, password } =
    parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const barcodeNorm = barcode?.trim() || undefined;
  const image = normalizeImageUrl(profileImageUrl);

  const existing = await prisma.user.findUnique({ where: { username: usn } });
  if (existing && existing.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Username already used by a non-student account" }, { status: 409 });
  }

  const emailTaken = await prisma.user.findFirst({
    where: {
      email: emailNorm,
      ...(existing ? { id: { not: existing.id } } : {}),
    },
  });
  if (emailTaken) {
    return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  }

  const passHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username: usn },
    create: {
      username: usn,
      email: emailNorm,
      passwordHash: passHash,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          fullName,
          program: program || null,
          section: section || null,
          phoneNumber: phoneNumber?.trim() || null,
          biometricId: biometricId?.trim() || null,
          profileImageUrl: image === "/default-avatar.svg" ? null : image,
          answerSheetCode: barcode || `ANS-${usn}`,
        },
      },
    },
    update: {
      email: emailNorm,
      passwordHash: passHash,
    },
    include: { studentProfile: true },
  });

  let profileId = user.studentProfile?.id;
  if (!profileId) {
    const created = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        fullName,
        program: program || null,
        section: section || null,
        phoneNumber: phoneNumber?.trim() || null,
        biometricId: biometricId?.trim() || null,
        profileImageUrl: image === "/default-avatar.svg" ? null : image,
        answerSheetCode: barcode || `ANS-${usn}`,
      },
    });
    profileId = created.id;
  } else {
    await prisma.studentProfile.update({
      where: { id: profileId },
      data: {
        fullName,
        program: program || null,
        section: section || null,
        phoneNumber: phoneNumber?.trim() || null,
        biometricId: biometricId?.trim() || null,
        profileImageUrl: image === "/default-avatar.svg" ? null : image,
        ...(barcodeNorm ? { answerSheetCode: barcodeNorm } : {}),
      },
    });
  }

  if (hallRoom || hallTicket || seatNumber) {
    await prisma.seatAssignment.upsert({
      where: { studentProfileId: profileId },
      create: {
        studentProfileId: profileId,
        hallRoom: hallRoom || "TBD",
        seatNumber: seatNumber || null,
        hallTicketNumber: hallTicket || `HT-${usn}`,
      },
      update: {
        hallRoom: hallRoom || "TBD",
        seatNumber: seatNumber || null,
        hallTicketNumber: hallTicket || `HT-${usn}`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    usn,
    email: emailNorm,
    message: "Student login created successfully",
  });
}

export async function GET() {
  const students = await prisma.studentProfile.findMany({
    include: {
      user: true,
      seat: true,
    },
    orderBy: [{ section: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json({
    students: students.map((profile) => ({
      usn: profile.user.username,
      fullName: profile.fullName,
      email: profile.user.email,
      program: profile.program,
      section: profile.section,
      phoneNumber: profile.phoneNumber,
      biometricId: profile.biometricId,
      hallRoom: profile.seat?.hallRoom ?? null,
      seatNumber: profile.seat?.seatNumber ?? null,
      hallTicket: profile.seat?.hallTicketNumber ?? null,
      answerSheetCode: profile.answerSheetCode,
      profileImageUrl: normalizeImageUrl(profile.profileImageUrl),
    })),
  });
}
