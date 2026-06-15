import { Client } from "minio";
import crypto from "crypto";
import path from "path";

const endpoint = process.env.MINIO_ENDPOINT || "localhost";
const port = Number(process.env.MINIO_PORT || 9002);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
const bucket = process.env.MINIO_BUCKET_MEDIA || "charity-media";

const BUCKET_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [{
    Sid: "PublicRead",
    Effect: "Allow",
    Principal: "*",
    Action: ["s3:GetObject"],
    Resource: [`arn:aws:s3:::${bucket}/*`],
  }],
});

let clientInstance: Client | null = null;

function getClient(): Client {
  if (!clientInstance) {
    clientInstance = new Client({ endPoint: endpoint, port, useSSL, accessKey, secretKey });
  }
  return clientInstance;
}

export async function ensureBucket(): Promise<void> {
  const client = getClient();
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
  }
  await client.setBucketPolicy(bucket, BUCKET_POLICY);
}

/** Normalize any stored media URL to a same-origin `/charity-media/...` path. */
export function normalizeStoredMediaUrl(url: string | null | undefined): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/charity-media/")) return trimmed;

  const objectMatch = trimmed.match(/\/charity-media\/(.+)$/);
  if (objectMatch?.[1]) {
    return `/charity-media/${objectMatch[1]}`;
  }

  return trimmed;
}

export function normalizeOptionalMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  return normalizeStoredMediaUrl(url);
}

function uniqueName(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 60);
  const hash = crypto.randomBytes(6).toString("hex");
  return `${base}-${hash}${ext}`;
}

export interface UploadResult {
  objectName: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = "/"
): Promise<UploadResult> {
  await ensureBucket();
  const client = getClient();
  const filename = uniqueName(originalName);
  const folderPath = folder === "/" || !folder ? "" : folder.replace(/^\/+|\/+$/g, "") + "/";
  const objectName = `${folderPath}${filename}`;

  await client.putObject(bucket, objectName, buffer, buffer.length, {
    "Content-Type": mimeType,
    "x-amz-acl": "public-read",
  });

  return {
    objectName,
    url: getPublicUrl(objectName),
    size: buffer.length,
    mimeType,
  };
}

export async function deleteFile(objectName: string): Promise<void> {
  const client = getClient();
  await client.removeObject(bucket, objectName);
}

export async function deleteFiles(objectNames: string[]): Promise<void> {
  const client = getClient();
  await client.removeObjects(bucket, objectNames);
}

export async function listFolders(prefix: string = ""): Promise<string[]> {
  const client = getClient();
  const folders: string[] = [];
  const normalizedPrefix = prefix && !prefix.endsWith("/") ? prefix + "/" : prefix;

  return new Promise((resolve, reject) => {
    const stream = client.listObjectsV2(bucket, normalizedPrefix, false);
    stream.on("data", (obj) => {
      if (obj.prefix) {
        const name = obj.prefix.replace(normalizedPrefix, "").replace(/\/$/, "");
        if (name) folders.push(name);
      }
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(folders));
  });
}

export function getPublicUrl(objectName: string): string {
  const normalized = objectName.replace(/^\/+/, "");
  return `/charity-media/${normalized}`;
}

export { bucket, getClient };
