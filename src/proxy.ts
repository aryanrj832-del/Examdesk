import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";

const COOKIE = "examdesk_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

async function readSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const role = payload.role as Role | undefined;
    if (!sub || !role) return null;
    return { sub, role };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await readSession(req);

  if (pathname.startsWith("/student/dashboard")) {
    if (!session || session.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/student/login", req.url));
    }
  }

  if (pathname.startsWith("/teacher/dashboard")) {
    if (!session || session.role !== "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/login", req.url));
    }
  }

  if (pathname.startsWith("/exam/dashboard")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/exam/login", req.url));
    }
  }

  if (pathname.startsWith("/api/student")) {
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/teacher")) {
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/dashboard/:path*", "/teacher/dashboard/:path*", "/exam/dashboard/:path*", "/api/student/:path*", "/api/teacher/:path*", "/api/admin/:path*"],
};
