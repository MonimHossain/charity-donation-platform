export type MergeData = Record<string, string | number | boolean | undefined | null>;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Unwrap common HTML entity encodings so `&#123;&#123;donorName&#125;&#125;` still merges. */
function decodeMergeBraceEntities(text: string): string {
  return text
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/&lcub;/gi, "{")
    .replace(/&rcub;/gi, "}");
}

/** Normalize name fields and common aliases used in templates. */
export function enrichMergeData(data: MergeData): MergeData {
  const email = formatValue(data.donorEmail);
  const fromFields = formatValue(
    data.donorName ?? data.userName ?? data.username ?? data.name
  );
  const donorName =
    fromFields || (email.includes("@") ? email.split("@")[0] || "Friend" : "Friend");

  return {
    ...data,
    donorName,
    userName: donorName,
    username: donorName,
    name: donorName,
  };
}

export function renderTemplateString(template: string, data: MergeData): string {
  const merged = enrichMergeData(data);
  const source = decodeMergeBraceEntities(template);
  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    return formatValue(merged[key]);
  });
}

export function renderTemplateSubject(subject: string, data: MergeData): string {
  return renderTemplateString(subject, data);
}

export function renderTemplateHtml(html: string, data: MergeData): string {
  return renderTemplateString(html, data);
}

export function currencySymbol(currency?: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "£";
}

export function formatAmount(amount: number, currency?: string): string {
  return `${currencySymbol(currency)}${Number(amount).toFixed(2)}`;
}

export function buildDonationMergeData(input: {
  donorName: string;
  donorEmail: string;
  amount: number;
  totalAmount: number;
  currency: string;
  receiptNumber?: string;
  campaignTitle?: string;
  giftAid?: boolean;
  giftAidAmount?: number;
  donationId?: string;
  appUrl?: string;
}): MergeData {
  const appUrl = input.appUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  return {
    donorName: input.donorName,
    donorEmail: input.donorEmail,
    amount: formatAmount(input.amount, input.currency),
    totalAmount: formatAmount(input.totalAmount, input.currency),
    currency: input.currency,
    receiptNumber: input.receiptNumber || "",
    campaignTitle: input.campaignTitle || "General Donation",
    giftAid: input.giftAid ? "Yes" : "No",
    giftAidAmount: input.giftAidAmount ? formatAmount(input.giftAidAmount, input.currency) : "",
    donationId: input.donationId || "",
    receiptUrl: input.donationId ? `${appUrl}/thank-you?donationId=${input.donationId}` : appUrl,
    accountUrl: `${appUrl}/account`,
    appUrl,
  };
}
