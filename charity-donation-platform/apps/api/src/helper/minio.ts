import * as Minio from "minio";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9002),
  useSSL: (process.env.MINIO_USE_SSL ?? "false") === "true",
  accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
});

const bucketName = process.env.MINIO_BUCKET_NAME ?? "charity-media";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`MinIO bucket "${bucketName}" created`);
  }
}

export function getPublicUrl(objectName: string): string {
  const base = process.env.MINIO_PUBLIC_BASE_URL ?? `http://localhost:9002/${bucketName}`;
  return `${base}/${objectName}`;
}
