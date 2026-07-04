import { spawn } from "child_process";
import { Response } from "express";
import { Readable, Transform } from "stream";
import archiver from "archiver";
import { AppDataSource } from "../../helper/connectDB.js";
import { BackupHistory } from "../../components/backup/backupHistory.entity.js";
import { bucket, getClient } from "../../helper/storage.js";

const dbHost = process.env.DB_HOST ?? "localhost";
const dbPort = String(process.env.DB_PORT ?? 54322);
const dbUser = process.env.DB_USERNAME ?? "admin";
const dbPassword = process.env.DB_PASSWORD ?? "admin123";
const dbName = process.env.DB_DATABASE ?? "charity_platform";

function backupFilename(type: "database" | "media"): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return type === "database"
    ? `db-backup-${stamp}.sql`
    : `media-backup-${stamp}.zip`;
}

export async function listBackupHistory(): Promise<BackupHistory[]> {
  const repo = AppDataSource.getRepository(BackupHistory);
  return repo.find({ order: { createdAt: "DESC" }, take: 100 });
}

async function recordBackup(
  filename: string,
  sizeBytes: number,
  type: "database" | "media",
): Promise<void> {
  const repo = AppDataSource.getRepository(BackupHistory);
  await repo.save({
    filename,
    sizeBytes: String(sizeBytes),
    type,
  });
}

function countingTransform(): { transform: Transform; getSize: () => number } {
  let sizeBytes = 0;
  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      sizeBytes += chunk.length;
      callback(null, chunk);
    },
  });
  return { transform, getSize: () => sizeBytes };
}

async function typeormFallbackDump(): Promise<Readable> {
  const lines: string[] = [
    "-- Charity platform database backup (TypeORM fallback)",
    `-- Generated: ${new Date().toISOString()}`,
    "",
  ];

  const tables = await AppDataSource.query<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  );

  for (const { tablename } of tables) {
    if (tablename === "backup_history") continue;
    const rows = await AppDataSource.query(`SELECT * FROM "${tablename}"`);
    if (!rows.length) continue;
    lines.push(`-- Table: ${tablename}`);
    for (const row of rows) {
      const cols = Object.keys(row);
      const vals = cols.map((c) => {
        const v = row[c];
        if (v === null) return "NULL";
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (v instanceof Date) return `'${v.toISOString()}'`;
        if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      lines.push(
        `INSERT INTO "${tablename}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});`,
      );
    }
    lines.push("");
  }

  return Readable.from(lines.join("\n"));
}

async function createDatabaseDumpStream(): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "pg_dump",
      [
        "-h",
        dbHost,
        "-p",
        dbPort,
        "-U",
        dbUser,
        "-d",
        dbName,
        "--no-owner",
        "--no-acl",
      ],
      {
        env: { ...process.env, PGPASSWORD: dbPassword },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    proc.on("error", () => {
      typeormFallbackDump().then(resolve).catch(reject);
    });

    if (proc.stdout) {
      resolve(proc.stdout);
      return;
    }

    typeormFallbackDump().then(resolve).catch(reject);
  });
}

export async function streamDatabaseBackup(
  res: Response,
): Promise<{ filename: string; sizeBytes: number }> {
  const filename = backupFilename("database");
  res.setHeader("Content-Type", "application/sql");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const source = await createDatabaseDumpStream();
  const { transform, getSize } = countingTransform();

  await new Promise<void>((resolve, reject) => {
    source.pipe(transform).pipe(res);
    res.on("finish", resolve);
    res.on("error", reject);
    source.on("error", reject);
    transform.on("error", reject);
  });

  const sizeBytes = getSize();
  await recordBackup(filename, sizeBytes, "database");
  return { filename, sizeBytes };
}

async function listAllMinioObjects(): Promise<string[]> {
  const client = getClient();
  const objects: string[] = [];

  return new Promise((resolve, reject) => {
    const stream = client.listObjectsV2(bucket, "", true);
    stream.on("data", (obj) => {
      if (obj.name) objects.push(obj.name);
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(objects));
  });
}

export async function streamMediaBackup(
  res: Response,
): Promise<{ filename: string; sizeBytes: number }> {
  const filename = backupFilename("media");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const client = getClient();
  const objects = await listAllMinioObjects();
  const archive = archiver("zip", { zlib: { level: 6 } });
  const { transform, getSize } = countingTransform();

  await new Promise<void>((resolve, reject) => {
    archive.pipe(transform).pipe(res);
    res.on("finish", resolve);
    res.on("error", reject);
    archive.on("error", reject);
    transform.on("error", reject);

    (async () => {
      try {
        for (const objectName of objects) {
          const dataStream = await client.getObject(bucket, objectName);
          archive.append(dataStream, { name: objectName });
        }
        await archive.finalize();
      } catch (err) {
        reject(err);
      }
    })();
  });

  const sizeBytes = getSize();
  await recordBackup(filename, sizeBytes, "media");
  return { filename, sizeBytes };
}
