import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Charity } from "./charity.entity.js";

@Entity("certifications")
export class Certification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  charityId!: number;

  @ManyToOne("Charity", "certifications", { onDelete: "CASCADE" })
  @JoinColumn({ name: "charityId" })
  charity!: Charity;

  @Column({ type: "varchar", length: 100, unique: true })
  certificateId!: string;

  @Column({ type: "varchar", length: 50, default: "active" })
  status!: string;

  @Column({ type: "date" })
  issueDate!: string;

  @Column({ type: "date" })
  expiryDate!: string;

  @Column({ type: "int" })
  certificationYear!: number;

  @Column({ type: "boolean", default: true })
  badgeEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
