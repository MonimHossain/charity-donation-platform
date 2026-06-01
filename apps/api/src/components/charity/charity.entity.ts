import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import type { Certification } from "./certification.entity.js";

@Entity("charities")
export class Charity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 100, default: "United Kingdom" })
  country!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logoUrl?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  websiteUrl?: string | null;

  @Column({ type: "text", nullable: true })
  shortDescription?: string | null;

  @Column({ type: "varchar", length: 50, default: "pending" })
  auditStatus!: string;

  @Column({ type: "text", nullable: true })
  auditSummary?: string | null;

  @Column({ type: "date", nullable: true })
  auditDate?: string | null;

  @Column({ type: "int", nullable: true })
  overallScore?: number | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  riskLevel?: string | null;

  @Column({ type: "jsonb", nullable: true })
  scoreBreakdown?: Record<string, number> | null;

  @Column({ type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ type: "boolean", default: true })
  isPublished!: boolean;

  @OneToMany("Certification", "charity")
  certifications!: Certification[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
