import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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

  @Column({ type: "varchar", length: 30, default: "new" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
