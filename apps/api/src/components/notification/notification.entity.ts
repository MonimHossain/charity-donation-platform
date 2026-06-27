import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type NotificationRecipientType = "user" | "admin";

@Entity("notifications")
@Index(["recipientType", "recipientId", "readAt"])
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20 })
  recipientType!: NotificationRecipientType;

  @Column({ type: "uuid" })
  recipientId!: string;

  @Column({ type: "varchar", length: 80 })
  type!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  actionUrl?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: "timestamp", nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
