import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  action!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  entityType?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  entityId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  userEmail?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  userRole?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  ipAddress?: string;

  @Column({ type: "text", nullable: true })
  userAgent?: string;

  @Column({ type: "json", nullable: true })
  details?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
