import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformEnhancements20260704 implements MigrationInterface {
  name = "AddPlatformEnhancements20260704";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS "displayDonorOffset" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS "currencyRatesUpdatedAt" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      ALTER TABLE testimonials
      ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'approved'
    `);

    await queryRunner.query(`
      ALTER TABLE testimonials
      ADD COLUMN IF NOT EXISTS "userId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE testimonials
      ADD COLUMN IF NOT EXISTS source varchar(20) NOT NULL DEFAULT 'admin'
    `);

    await queryRunner.query(`
      ALTER TABLE testimonials
      ADD COLUMN IF NOT EXISTS location varchar(255)
    `);

    await queryRunner.query(`
      UPDATE testimonials SET status = 'rejected' WHERE "isVisible" = false
    `);

    await queryRunner.query(`
      UPDATE testimonials SET status = 'approved' WHERE "isVisible" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE campaigns DROP COLUMN IF EXISTS "displayDonorOffset"`);
    await queryRunner.query(`ALTER TABLE site_settings DROP COLUMN IF EXISTS "currencyRatesUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE testimonials DROP COLUMN IF EXISTS location`);
    await queryRunner.query(`ALTER TABLE testimonials DROP COLUMN IF EXISTS source`);
    await queryRunner.query(`ALTER TABLE testimonials DROP COLUMN IF EXISTS "userId"`);
    await queryRunner.query(`ALTER TABLE testimonials DROP COLUMN IF EXISTS status`);
  }
}
