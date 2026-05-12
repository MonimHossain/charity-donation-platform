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

@Entity("recurring_donations")
export class RecurringDonation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 255 })
  donorName!: string;

  @Column({ type: "varchar", length: 255 })
  donorEmail!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  currency!: string;

  @Column({ type: "varchar", length: 20, default: "monthly" })
  frequency!: string;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: string;

  @Column({ type: "uuid", nullable: true })
  campaignId?: string;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "campaignId" })
  campaign?: Campaign;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripeCustomerId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  paypalSubscriptionId?: string;

  @Column({ type: "varchar", length: 50, default: "stripe" })
  paymentMethod!: string;

  @Column({ type: "boolean", default: false })
  giftAid!: boolean;

  @Column({ type: "timestamp", nullable: true })
  nextPaymentDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  lastPaymentDate?: Date;

  @Column({ type: "int", default: 0 })
  totalPayments!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalPaid!: number;

  @Column({ type: "int", default: 0 })
  failedAttempts!: number;

  @Column({ type: "timestamp", nullable: true })
  cancelledAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  pausedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
