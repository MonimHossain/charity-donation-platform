const COOKIE_NAME = "icac_donor_id";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

/** Stable first-party donor id for guest users (Meta / enhanced conversions). */
export function getDonorExternalId(loggedInUserId?: string | null): string {
  if (loggedInUserId) return `donor_${loggedInUserId}`;

  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing.startsWith("donor_") ? existing : `donor_${existing}`;

  const id = `donor_${crypto.randomUUID()}`;
  writeCookie(COOKIE_NAME, id);
  return id;
}
