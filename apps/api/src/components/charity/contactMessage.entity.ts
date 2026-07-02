import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("contact_messages")
export class ContactMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 500 })
  subject!: string;

  @Column({ type: "text" })
  message!: string;

  /** Maps to legacy `status` column in existing databases. */
  @Column({ name: "status", type: "varchar", length: 30, default: "NEW" })
  submissionStatus!: string;

  @Column({ type: "text", nullable: true })
  internalNotes?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
