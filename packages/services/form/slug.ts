import { customAlphabet } from "nanoid";

const nanoid6 = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function kebab(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 200);
}

export function generateSlug(title: string): string {
  const base = kebab(title) || "form";
  return `${base}-${nanoid6()}`;
}
