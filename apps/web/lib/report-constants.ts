export function formatReportFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const REPORT_FILE_TYPE_OPTIONS = [
  { value: "PDF", label: "PDF" },
  { value: "DOCUMENT", label: "Document" },
  { value: "IMAGE", label: "Image" },
  { value: "OTHER", label: "Other" },
] as const;

export const REPORT_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;
