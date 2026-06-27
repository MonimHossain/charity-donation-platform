import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type EmailCampaignType =
  | "bulk_users"
  | "newsletter"
  | "annual_summary"
  | "admin_alert";

export type EmailCampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "completed"
  | "failed";

@Entity("email_campaigns")
export class EmailCampaign {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  type!: EmailCampaignType;

  @Column({ type: "uuid", nullable: true })
  templateId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  name?: string;

  @Column({ type: "varchar", length: 30, default: "draft" })
  status!: EmailCampaignStatus;

  @Column({ type: "timestamp", nullable: true })
  scheduledAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  @Column({ type: "json", default: {} })
  config!: Record<string, unknown>;

  @Column({ type: "json", default: { sent: 0, failed: 0, skipped: 0 } })
  stats!: { sent: number; failed: number; skipped: number };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
