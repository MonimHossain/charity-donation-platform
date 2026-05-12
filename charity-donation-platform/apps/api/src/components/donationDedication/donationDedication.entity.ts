import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Donation } from "../donation/donation.entity.js";

@Entity("donation_dedications")
export class DonationDedication {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  donationId!: string;

  @ManyToOne(() => Donation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "donationId" })
  donation!: Donation;

  @Column({ type: "varchar", length: 50 })
  dedicationType!: string;

  @Column({ type: "varchar", length: 255 })
  recipientName!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  recipientEmail?: string;

  @Column({ type: "text", nullable: true })
  personalMessage?: string;

  @Column({ type: "boolean", default: false })
  sendNotification!: boolean;

  @Column({ type: "boolean", default: false })
  notificationSent!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
