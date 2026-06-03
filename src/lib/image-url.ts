/** Accept absolute URLs or site-relative paths (e.g. /uploads/photo.jpg). */
export function normalizeImageUrl(raw?: string | null): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "/default-avatar.svg";
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") return trimmed;
  } catch {
    /* fall through */
  }
  return "/default-avatar.svg";
}
