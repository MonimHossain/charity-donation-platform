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

@Entity("donations")
export class Donation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  currency!: string;

  @Column({ type: "varchar", length: 20, default: "single" })
  frequency!: string;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: string;

  @Column({ type: "uuid", nullable: true })
  campaignId?: string;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "campaignId" })
  campaign?: Campaign;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 255 })
  donorName!: string;

  @Column({ type: "varchar", length: 255 })
  donorEmail!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  donorPhone?: string;

  @Column({ type: "boolean", default: false })
  giftAid!: boolean;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  giftAidAmount!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  totalAmount!: number;

  @Column({ type: "boolean", default: false })
  isAnonymous!: boolean;

  @Column({ type: "text", nullable: true })
  message?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  donationType?: string;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  unitPrice?: number;

  @Column({ type: "json", nullable: true })
  attributeSelections?: Record<string, string>;

  @Column({ type: "json", nullable: true })
  upsellAmounts?: Array<{ label: string; amount: number }>;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  upsellTotal!: number;

  @Column({ type: "uuid", nullable: true })
  zakatCalculationId?: string;

  @Column({ type: "uuid", nullable: true })
  automatedScheduleId?: string;

  @Column({ type: "varchar", length: 50, default: "stripe" })
  paymentMethod!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  paypalOrderId?: string;

  @Column({ type: "boolean", default: false })
  marketingConsent!: boolean;

  @Column({ type: "boolean", default: false })
  smsConsent!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  dedicationType?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  dedicationRecipientName?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  dedicationRecipientEmail?: string;

  @Column({ type: "text", nullable: true })
  dedicationMessage?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  receiptNumber?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
