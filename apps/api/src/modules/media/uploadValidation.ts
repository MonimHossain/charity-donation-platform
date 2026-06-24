import path from "path";

const BLOCKED_EXTENSIONS = new Set([
  ".html", ".htm", ".xhtml", ".svg", ".xml",
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".php", ".phtml", ".asp", ".aspx", ".jsp",
  ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".cmd",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".msi",
  ".jar", ".war", ".class",
  ".htaccess", ".env",
]);

const ALLOWED_MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "application/pdf": [".pdf"],
};

const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

export interface UploadFileLike {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export type UploadValidationResult =
  | { ok: true; mimeType: string; extension: string }
  | { ok: false; message: string };

function normalizeMime(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() ?? "";
}

function fileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext;
}

function matchesMagicBytes(buffer: Buffer, mime: string): boolean {
  const rules = MAGIC_BYTES.filter((rule) => rule.mime === mime);
  if (rules.length === 0) return true;

  return rules.some((rule) => {
    const offset = rule.offset ?? 0;
    if (buffer.length < offset + rule.bytes.length) return false;
    return rule.bytes.every((byte, index) => buffer[offset + index] === byte);
  });
}

export function validateMediaUpload(file: UploadFileLike): UploadValidationResult {
  const originalName = file.originalname?.trim() ?? "";
  if (!originalName || originalName.includes("\0")) {
    return { ok: false, message: "Invalid file name" };
  }
  if (originalName.includes("..") || path.basename(originalName) !== originalName) {
    return { ok: false, message: "Invalid file name" };
  }

  const extension = fileExtension(originalName);
  if (!extension) {
    return { ok: false, message: "File must have an extension" };
  }
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, message: `File type not allowed: ${extension}` };
  }

  const mimeType = normalizeMime(file.mimetype);
  const allowedExtensions = ALLOWED_MIME_TO_EXTENSIONS[mimeType];
  if (!allowedExtensions) {
    return { ok: false, message: `File type not allowed: ${mimeType || "unknown"}` };
  }
  if (!allowedExtensions.includes(extension)) {
    return {
      ok: false,
      message: `Extension ${extension} does not match content type ${mimeType}`,
    };
  }

  if (!file.buffer?.length) {
    return { ok: false, message: "Empty file" };
  }

  if (!matchesMagicBytes(file.buffer, mimeType)) {
    return { ok: false, message: "File content does not match its declared type" };
  }

  if (mimeType === "image/webp" && file.buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    return { ok: false, message: "File content does not match its declared type" };
  }

  return { ok: true, mimeType, extension };
}
