import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("activity_logs")
export class ActivityLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  type!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  sessionId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  page?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  referrer?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: "varchar", length: 100, nullable: true })
  ipAddress?: string;

  @Column({ type: "text", nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
