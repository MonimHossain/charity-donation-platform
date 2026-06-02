import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Campaign } from "../campaign/campaign.entity.js";

@Entity("automated_donation_schedules")
export class AutomatedDonationSchedule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 255 })
  donorName!: string;

  @Column({ type: "varchar", length: 255 })
  donorEmail!: string;

  @Column({ type: "uuid", nullable: true })
  campaignId?: string;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "campaignId" })
  campaign?: Campaign;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  totalAmount!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  dailyAmount!: number;

  /**
   * Optional per-day breakdown (e.g. Ramadan nights weighting).
   * When present, `totalDays` should match this length.
   */
  @Column({ type: "jsonb", nullable: true })
  dailyBreakdown?: number[];

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date" })
  endDate!: Date;

  @Column({ type: "int" })
  totalDays!: number;

  @Column({ type: "int", default: 0 })
  completedDays!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  paidAmount!: number;

  @Column({ type: "varchar", length: 20, default: "scheduled" })
  status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripeScheduleId?: string;

  @Column({ type: "varchar", length: 50, default: "stripe" })
  paymentMethod!: string;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  currency!: string;

  @Column({ type: "boolean", default: false })
  giftAid!: boolean;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
