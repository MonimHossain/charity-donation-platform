import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  fullName!: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  postcode?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  country?: string;

  @Column({ type: "varchar", length: 20, default: "donor" })
  role!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "boolean", default: false })
  emailVerified!: boolean;

  @Column({ type: "varchar", length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalDonated!: number;

  @Column({ type: "int", default: 0 })
  donationCount!: number;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  preferredCurrency!: string;

  @Column({ type: "varchar", length: 10, default: "en" })
  preferredLanguage!: string;

  @Column({ type: "boolean", default: false })
  marketingConsent!: boolean;

  @Column({ type: "boolean", default: false })
  smsConsent!: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
