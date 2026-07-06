import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewSource = "donor" | "admin";

@Entity("testimonials")
export class Testimonial {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  role?: string;

  @Column({ type: "text" })
  quote!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: "int", default: 5 })
  rating!: number;

  /** @deprecated Use status instead; kept for legacy rows */
  @Column({ type: "boolean", default: true })
  isVisible!: boolean;

  @Column({ type: "varchar", length: 20, default: "approved" })
  status!: ReviewStatus;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 20, default: "admin" })
  source!: ReviewSource;

  @Column({ type: "varchar", length: 255, nullable: true })
  location?: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
