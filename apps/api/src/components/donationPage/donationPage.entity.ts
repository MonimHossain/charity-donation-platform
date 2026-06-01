import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("donation_pages")
export class DonationPage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 100, default: "general" })
  category!: string;

  @Column({ type: "text", nullable: true })
  shortDescription?: string | null;

  @Column({ type: "varchar", length: 50, default: "draft" })
  status!: string;

  @Column({ type: "uuid", nullable: true })
  campaignId?: string | null;

  @Column({ type: "jsonb", default: {} })
  config!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
