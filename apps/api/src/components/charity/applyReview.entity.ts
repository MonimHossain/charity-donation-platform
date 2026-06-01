import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("apply_review_submissions")
export class ApplyReviewSubmission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  charityName!: string;

  @Column({ type: "varchar", length: 255 })
  contactName!: string;

  @Column({ type: "varchar", length: 255 })
  contactEmail!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  country?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  websiteUrl?: string | null;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ type: "varchar", length: 30, default: "pending" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
