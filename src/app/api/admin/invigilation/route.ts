import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function splitRow(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const tab = trimmed.split("\t");
  if (tab.length >= 2) {
    return [tab[0]!.trim(), tab.slice(1).join("\t").trim()];
  }
  const parts = trimmed.split(",");
  if (parts.length >= 2) {
    return [parts[0]!.trim(), parts.slice(1).join(",").trim()];
  }
  return null;
}

const bodySchema = z.object({
  csv: z.string(),
  replace: z.boolean().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const lines = parsed.data.csv.split(/\r?\n/);
  const rows: { hallRoom: string; csvTeacherLabel: string; teacherWebsite?: string }[] = [];

  for (const line of lines) {
    const parts = splitRow(line);
    if (!parts) continue;
    const [hallRoom, teacherLabel] = parts;
    if (!hallRoom) continue;
    const [name, website] = teacherLabel.split(/\s*\|\s*|\s*,\s*/).map((part) => part.trim());
    rows.push({ hallRoom, csvTeacherLabel: name, teacherWebsite: website || undefined });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows parsed" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.replace) {
      await tx.invigilationSlot.deleteMany({});
    }
    await tx.invigilationSlot.createMany({
      data: rows.map((row) => ({
        ...row,
        teacherWebsite: row.teacherWebsite,
      })),
    });
  });

  return NextResponse.json({ imported: rows.length });
}
