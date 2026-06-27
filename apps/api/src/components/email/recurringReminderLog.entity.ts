import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("recurring_reminder_logs")
@Index(["sourceType", "sourceId"], { unique: true })
export class RecurringReminderLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  sourceType!: string;

  @Column({ type: "varchar", length: 255 })
  sourceId!: string;

  @Column({ type: "timestamp", nullable: true })
  chargeDate?: Date;

  @CreateDateColumn()
  reminderSentAt!: Date;
}
