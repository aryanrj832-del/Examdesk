import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function processImageUploadFormData(form: FormData | null) {
  if (!form) {
    throw new Error("Invalid form data");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file uploaded");
  }

  if (!ALLOWED.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 5 MB");
  }

  const ext =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
      ? ".webp"
      : file.type === "image/gif"
      ? ".gif"
      : ".jpg";

  const name = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), bytes);

  return `/uploads/${name}`;
}
