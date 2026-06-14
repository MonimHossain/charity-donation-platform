import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export interface QuickDonatePrice {
  amount: number;
  sortOrder: number;
}

@Entity("quick_donate_options")
export class QuickDonateOption {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Label shown in the frontend dropdown ("Will appear as"). */
  @Column({ type: "varchar", length: 255 })
  label!: string;

  @Column({ type: "uuid", nullable: true })
  campaignId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  campaignSlug?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  campaignTitle?: string;

  @Column({ type: "json", default: [] })
  prices!: QuickDonatePrice[];

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
