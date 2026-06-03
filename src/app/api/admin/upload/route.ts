import { NextResponse } from "next/server";
import { processImageUploadFormData } from "@/lib/upload";

export async function POST(req: Request) {
  try {
    const url = await processImageUploadFormData(await req.formData().catch(() => null));
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
