import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";
import { isHeaderRow, parseCsvLine } from "@/lib/csv-parse";

const bodySchema = z.object({
  csv: z.string(),
  password: z.string().min(4).default("demo123"),
});

type Row = {
  usn: string;
  fullName: string;
  email: string;
  section: string | null;
  hallRoom: string;
  hallTicket: string;
  barcode: string;
  program: string | null;
  phoneNumber: string | null;
  biometricId: string | null;
  seatNumber: string | null;
};

function parseStudentRow(parts: string[]): Row | null {
  if (parts.length < 5) return null;
  const clean = parts.map((p) => p.trim()).filter((_, i, arr) => i < arr.length);
  const extra = clean.slice(8).map((value) => value || null);
  const phoneNumber = extra[0] ?? null;
  const biometricId = extra[1] ?? null;
  const seatNumber = extra[2] ?? null;

  if (clean.length === 5) {
    const [usn, fullName, hallRoom, hallTicket, barcode] = clean;
    if (!usn || !fullName) return null;
    return {
      usn,
      fullName,
      email: "",
      section: null,
      hallRoom: hallRoom || "TBD",
      hallTicket: hallTicket || `HT-${usn}`,
      barcode: barcode || `ANS-${usn}`,
      program: null,
      phoneNumber,
      biometricId,
      seatNumber,
    };
  }

  if (clean.length === 6) {
    const [usn, fullName, col3, col4, col5, col6] = clean;
    if (!usn || !fullName) return null;
    if (col3.includes("@")) {
      return {
        usn,
        fullName,
        email: col3.toLowerCase(),
        section: col4 || null,
        hallRoom: col5 || "TBD",
        hallTicket: col6 || `HT-${usn}`,
        barcode: `ANS-${usn}`,
        program: null,
        phoneNumber,
        biometricId,
        seatNumber,
      };
    }
    return {
      usn,
      fullName,
      email: "",
      section: null,
      hallRoom: col3 || "TBD",
      hallTicket: col4 || `HT-${usn}`,
      barcode: col5 || `ANS-${usn}`,
      program: col6 || null,
      phoneNumber,
      biometricId,
      seatNumber,
    };
  }

  if (clean.length === 7) {
    const [usn, fullName, email, section, hallRoom, hallTicket, barcode] = clean;
    if (!usn || !fullName) return null;
    return {
      usn,
      fullName,
      email: email.includes("@") ? email.toLowerCase() : "",
      section: section || null,
      hallRoom: hallRoom || "TBD",
      hallTicket: hallTicket || `HT-${usn}`,
      barcode: barcode || `ANS-${usn}`,
      program: null,
      phoneNumber,
      biometricId,
      seatNumber,
    };
  }

  if (clean.length === 8) {
    const [usn, fullName, email, program, section, hallRoom, hallTicket, barcode] = clean;
    if (!usn || !fullName) return null;
    return {
      usn,
      fullName,
      email: email.includes("@") ? email.toLowerCase() : "",
      section: section || null,
      program: program || null,
      hallRoom: hallRoom || "TBD",
      hallTicket: hallTicket || `HT-${usn}`,
      barcode: barcode || `ANS-${usn}`,
      phoneNumber,
      biometricId,
      seatNumber,
    };
  }

  if (clean.length === 9) {
    const [usn, fullName, email, program, section, hallRoom, hallTicket, barcode, phone] = clean;
    if (!usn || !fullName) return null;
    return {
      usn,
      fullName,
      email: email.includes("@") ? email.toLowerCase() : "",
      section: section || null,
      program: program || null,
      hallRoom: hallRoom || "TBD",
      hallTicket: hallTicket || `HT-${usn}`,
      barcode: barcode || `ANS-${usn}`,
      phoneNumber: phone || null,
      biometricId: null,
      seatNumber,
    };
  }

  if (clean.length === 10) {
    const [usn, fullName, email, program, section, hallRoom, hallTicket, barcode, phone, biometric] = clean;
    if (!usn || !fullName) return null;
    return {
      usn,
      fullName,
      email: email.includes("@") ? email.toLowerCase() : "",
      section: section || null,
      program: program || null,
      hallRoom: hallRoom || "TBD",
      hallTicket: hallTicket || `HT-${usn}`,
      barcode: barcode || `ANS-${usn}`,
      phoneNumber: phone || null,
      biometricId: biometric || null,
      seatNumber,
    };
  }

  if (clean.length >= 11) {
    const [usn, fullName, email, program, section, hallRoom, seatNumber, hallTicket, barcode, phone, biometric] = clean;
    if (!usn || !fullName) return null;
    return {
      usn,
      fullName,
      email: email.includes("@") ? email.toLowerCase() : "",
      section: section || null,
      program: program || null,
      hallRoom: hallRoom || "TBD",
      hallTicket: hallTicket || `HT-${usn}`,
      barcode: barcode || `ANS-${usn}`,
      phoneNumber: phone || null,
      biometricId: biometric || null,
      seatNumber: seatNumber || null,
    };
  }
  return null;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const passHash = await hashPassword(parsed.data.password);
  const lines = parsed.data.csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let count = 0;
  const errors: string[] = [];

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (isHeaderRow(parts)) continue;

    const row = parseStudentRow(parts);
    if (!row) {
      errors.push(`Skipped invalid line: ${line.slice(0, 40)}…`);
      continue;
    }

    const existingUser = await prisma.user.findUnique({ where: { username: row.usn } });
    if (existingUser && existingUser.role !== Role.STUDENT) {
      errors.push(`USN ${row.usn}: username used by another role`);
      continue;
    }

    if (row.email) {
      const emailUsed = await prisma.user.findFirst({
        where: {
          email: row.email,
          ...(existingUser ? { id: { not: existingUser.id } } : {}),
        },
      });
      if (emailUsed) {
        errors.push(`USN ${row.usn}: email already registered`);
        continue;
      }
    }

    try {
      const user = await prisma.user.upsert({
        where: { username: row.usn },
        create: {
          username: row.usn,
          email: row.email || null,
          passwordHash: passHash,
          role: Role.STUDENT,
          studentProfile: {
            create: {
              fullName: row.fullName,
              program: row.program,
              section: row.section,
              phoneNumber: row.phoneNumber,
              biometricId: row.biometricId,
              answerSheetCode: row.barcode,
            },
          },
        },
        update: {
          email: row.email || undefined,
          passwordHash: passHash,
        },
        include: { studentProfile: true },
      });

      let profileId = user.studentProfile?.id;
      if (!profileId) {
        const created = await prisma.studentProfile.create({
          data: {
            userId: user.id,
            fullName: row.fullName,
            program: row.program,
            section: row.section,
            answerSheetCode: row.barcode,
          },
        });
        profileId = created.id;
      } else {
        await prisma.studentProfile.update({
          where: { id: profileId },
          data: {
            fullName: row.fullName,
            program: row.program,
            section: row.section,
            phoneNumber: row.phoneNumber,
            biometricId: row.biometricId,
            answerSheetCode: row.barcode,
          },
        });
      }

      await prisma.seatAssignment.upsert({
        where: { studentProfileId: profileId },
        create: {
          studentProfileId: profileId,
          hallRoom: row.hallRoom,
          seatNumber: row.seatNumber,
          hallTicketNumber: row.hallTicket,
        },
        update: {
          hallRoom: row.hallRoom,
          seatNumber: row.seatNumber,
          hallTicketNumber: row.hallTicket,
        },
      });

      count += 1;
    } catch (e) {
      errors.push(`USN ${row.usn}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (count === 0) {
    return NextResponse.json(
      {
        error:
          "No rows imported. Format: USN,Name,Email,Section,Hall,HallTicket,Barcode (or legacy shorter formats).",
        details: errors.slice(0, 5),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    imported: count,
    warnings: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
