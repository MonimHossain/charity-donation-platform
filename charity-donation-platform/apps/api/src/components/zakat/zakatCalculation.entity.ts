import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("zakat_calculations")
export class ZakatCalculation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  sessionId?: string;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  goldValue!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  silverValue!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  cashInHand!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  cashInBank!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  investments!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  businessStock!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  receivables!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  property!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  otherAssets!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  personalDebt!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  otherLiabilities!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  totalAssets!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  totalLiabilities!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  netWealth!: number;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  nisabThreshold!: number;

  @Column({ type: "boolean", default: false })
  isAboveNisab!: boolean;

  @Column({ type: "decimal", precision: 14, scale: 2, default: 0 })
  zakatPayable!: number;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  currency!: string;

  @Column({ type: "varchar", length: 20, default: "full" })
  paymentPreference!: string;

  @Column({ type: "int", nullable: true })
  splitCount?: number;

  @Column({ type: "uuid", nullable: true })
  donationId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
