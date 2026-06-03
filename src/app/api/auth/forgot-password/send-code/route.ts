import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role as Role;

  const user = await prisma.user.findFirst({
    where: { email, role },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No account found with this email for the selected portal. Contact the examination section." },
      { status: 404 }
    );
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: { userId: user.id, code, expiresAt },
  });

  const mail = await sendVerificationEmail(email, code);

  return NextResponse.json({
    ok: true,
    message: mail.sent
      ? "Verification code sent to your email."
      : "SMTP is not configured. Check the server console for the code (development only).",
    devHint: mail.devLogged && process.env.NODE_ENV === "development",
  });
}
