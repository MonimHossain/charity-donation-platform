import type { DataSource } from "typeorm";

/**
 * Idempotent schema updates when DB_SYNCHRONIZE=false (migrations path).
 * Not used when synchronize is enabled — TypeORM owns the schema.
 */
export async function applyPlatformEnhancementSchemaPatches(
  dataSource: DataSource
): Promise<void> {
  const ddl = [
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "displayDonorOffset" integer NOT NULL DEFAULT 0`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "currencyRatesUpdatedAt" TIMESTAMPTZ`,
    `ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'approved'`,
    `ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS "userId" uuid`,
    `ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source varchar(20) NOT NULL DEFAULT 'admin'`,
    `ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS location varchar(255)`,
  ];

  for (const sql of ddl) {
    try {
      await dataSource.query(sql);
    } catch (error) {
      console.warn("[schema-patch] DDL skipped:", (error as Error).message);
    }
  }

  try {
    await dataSource.query(`
      UPDATE testimonials SET status = 'rejected'
      WHERE "isVisible" = false AND status <> 'rejected'
    `);
    await dataSource.query(`
      UPDATE testimonials SET status = 'approved'
      WHERE "isVisible" = true AND status NOT IN ('approved', 'rejected')
    `);
  } catch (error) {
    console.warn("[schema-patch] testimonial status backfill skipped:", (error as Error).message);
  }
}
