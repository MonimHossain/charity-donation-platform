const STORAGE_PREFIX = "gtm_purchase_";

export function shouldFirePurchase(transactionId: string): boolean {
  if (typeof window === "undefined" || !transactionId) return false;
  const key = `${STORAGE_PREFIX}${transactionId}`;
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, "1");
  return true;
}
