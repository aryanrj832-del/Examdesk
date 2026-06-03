import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";
import { normalizeImageUrl } from "@/lib/image-url";

const bodySchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4).optional(),
  fullName: z.string().min(2),
  department: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  profileImageUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const image = normalizeImageUrl(parsed.data.profileImageUrl);
  const emailRaw = parsed.data.email?.trim();
  const email = emailRaw && emailRaw.includes("@") ? emailRaw.toLowerCase() : null;
  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    include: { teacherProfile: true },
  });

  if (!existing && !parsed.data.password) {
    return NextResponse.json({ error: "Password is required for new teacher" }, { status: 400 });
  }

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, username: { not: parsed.data.username } },
    });
    if (taken) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
  }

  if (existing && existing.role !== Role.TEACHER) {
    return NextResponse.json({ error: "Username already used by a non-teacher account" }, { status: 409 });
  }

  const updateData: { email: string | null; passwordHash?: string } = {
    email,
  };

  if (parsed.data.password) {
    updateData.passwordHash = await hashPassword(parsed.data.password);
  }

  await prisma.user.upsert({
    where: { username: parsed.data.username },
    create: {
      username: parsed.data.username,
      email,
      passwordHash: parsed.data.password ? await hashPassword(parsed.data.password) : "",
      role: Role.TEACHER,
      teacherProfile: {
        create: {
          fullName: parsed.data.fullName,
          department: parsed.data.department,
          profileImageUrl: image,
        },
      },
    },
    update: {
      ...updateData,
      teacherProfile: existing?.teacherProfile
        ? {
            update: {
              fullName: parsed.data.fullName,
              department: parsed.data.department,
              profileImageUrl: image,
            },
          }
        : {
            create: {
              fullName: parsed.data.fullName,
              department: parsed.data.department,
              profileImageUrl: image,
            },
          },
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const teachers = await prisma.user.findMany({
    where: { role: Role.TEACHER },
    include: { teacherProfile: true },
    orderBy: { username: "asc" },
  });

  return NextResponse.json({
    teachers: teachers.map((user) => ({
      username: user.username,
      email: user.email,
      fullName: user.teacherProfile?.fullName ?? "",
      department: user.teacherProfile?.department ?? "",
      profileImageUrl: user.teacherProfile?.profileImageUrl ?? null,
    })),
  });
}
