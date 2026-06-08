export function isCampaignExpired(
  expirationEnabled?: boolean,
  expiresAt?: string | null
): boolean {
  if (!expirationEnabled || !expiresAt) return false;
  const end = new Date(expiresAt).getTime();
  return !Number.isNaN(end) && end <= Date.now();
}

export function getRemainingMs(expiresAt: string, now: number) {
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - now);
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}
