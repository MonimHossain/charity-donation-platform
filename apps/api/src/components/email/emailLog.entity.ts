import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("email_logs")
@Index(["recipientEmail", "sentAt"])
export class EmailLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  templateId?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  templateKey?: string;

  @Column({ type: "varchar", length: 255 })
  recipientEmail!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  recipientType?: string;

  @Column({ type: "uuid", nullable: true })
  recipientId?: string;

  @Column({ type: "varchar", length: 500 })
  subject!: string;

  @Column({ type: "varchar", length: 20, default: "sent" })
  status!: string;

  @Column({ type: "text", nullable: true })
  error?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  sentAt!: Date;
}
