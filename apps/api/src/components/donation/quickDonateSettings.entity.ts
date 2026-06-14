import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export interface DonationCategoryOption {
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

@Entity("quick_donate_settings")
export class QuickDonateSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true, default: "default" })
  key!: string;

  @Column({ type: "json", default: [] })
  donationCategories!: DonationCategoryOption[];

  @Column({ type: "boolean", default: true })
  showSingleFrequency!: boolean;

  @Column({ type: "boolean", default: true })
  showRegularFrequency!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
