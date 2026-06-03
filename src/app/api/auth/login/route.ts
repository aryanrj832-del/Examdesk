import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, verifyPassword, signSession } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { username, password, role } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.role !== (role as Role)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, role: user.role });
}
