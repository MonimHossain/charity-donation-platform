import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type MarketingDailyLogRow = {
  date: string;
  amount: string;
};

/** Singleton row (`id = default`) for admin expenditure inputs. */
@Entity("expenditure_settings")
export class ExpenditureSettings {
  @PrimaryColumn({ type: "varchar", length: 32, default: "default" })
  id!: string;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  employeeSalaryMonthly!: string;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  infrastructureMonthly!: string;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  operationsMonthly!: string;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  miscellaneousMonthly!: string;

  /** @deprecated Legacy single daily rate — use marketingDailyLog */
  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  dailyMarketing!: string;

  /** One row per calendar day: `{ date: "YYYY-MM-DD", amount: "300.00" }` */
  @Column({ type: "json", default: [] })
  marketingDailyLog!: MarketingDailyLogRow[];

  @Column({ type: "date", nullable: true })
  trackingStartDate?: string | null;

  @Column({ type: "varchar", length: 8, default: "GBP" })
  currency!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
