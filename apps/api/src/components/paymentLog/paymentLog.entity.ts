import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Donation } from "../donation/donation.entity.js";
import { RecurringDonation } from "../recurringDonation/recurringDonation.entity.js";

@Entity("payment_logs")
export class PaymentLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  donationId?: string;

  @ManyToOne(() => Donation, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "donationId" })
  donation?: Donation;

  @Column({ type: "uuid", nullable: true })
  recurringDonationId?: string;

  @ManyToOne(() => RecurringDonation, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "recurringDonationId" })
  recurringDonation?: RecurringDonation;

  @Column({ type: "varchar", length: 50 })
  type!: string;

  @Column({ type: "varchar", length: 50 })
  provider!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  providerTransactionId?: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 3 })
  currency!: string;

  @Column({ type: "varchar", length: 50 })
  status!: string;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
