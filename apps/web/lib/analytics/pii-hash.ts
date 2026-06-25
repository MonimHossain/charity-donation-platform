export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Digits only, no leading zeros stripped from country code. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface UserDataPlain {
  external_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface UserDataHashed {
  external_id?: string;
  fn?: string;
  ln?: string;
  em?: string;
  ph?: string;
}

export async function hashUserData(plain: UserDataPlain): Promise<UserDataHashed> {
  const hashed: UserDataHashed = {};

  if (plain.external_id) {
    hashed.external_id = await sha256Hex(normalizeText(plain.external_id));
  }
  if (plain.first_name) {
    hashed.fn = await sha256Hex(normalizeText(plain.first_name));
  }
  if (plain.last_name) {
    hashed.ln = await sha256Hex(normalizeText(plain.last_name));
  }
  if (plain.email) {
    hashed.em = await sha256Hex(normalizeEmail(plain.email));
  }
  if (plain.phone) {
    const digits = normalizePhone(plain.phone);
    if (digits) hashed.ph = await sha256Hex(digits);
  }

  return hashed;
}

export function splitDonorName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}
