import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  code: z.string().length(6),
  password: z.string().min(4),
  confirmPassword: z.string().min(4),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
  }

  const { email, role, code, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase(), role: role as Role },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Password updated successfully. You can sign in now." });
}
