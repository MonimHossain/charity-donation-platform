import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("concern_reports")
export class ConcernReport {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  charityName?: string | null;

  @Column({ type: "varchar", length: 255 })
  reporterName!: string;

  @Column({ type: "varchar", length: 255 })
  reporterEmail!: string;

  @Column({ type: "varchar", length: 100 })
  concernType!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "boolean", default: false })
  anonymous!: boolean;

  @Column({ type: "varchar", length: 30, default: "open" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
