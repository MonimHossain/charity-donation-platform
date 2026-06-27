import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type EmailTemplateCategory = "transactional" | "marketing" | "admin";

@Entity("email_templates")
export class EmailTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  key!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 50, default: "transactional" })
  category!: EmailTemplateCategory;

  @Column({ type: "varchar", length: 500 })
  subject!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  preheader?: string;

  @Column({ type: "text" })
  htmlBody!: string;

  @Column({ type: "json", default: [] })
  mergeTags!: string[];

  @Column({ type: "boolean", default: false })
  isSystem!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
