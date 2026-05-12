import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("seo_settings")
export class SeoSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 500, unique: true })
  pagePath!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  metaTitle?: string;

  @Column({ type: "text", nullable: true })
  metaDescription?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ogTitle?: string;

  @Column({ type: "text", nullable: true })
  ogDescription?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  ogImage?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  canonicalUrl?: string;

  @Column({ type: "boolean", default: false })
  noIndex!: boolean;

  @Column({ type: "json", default: [] })
  keywords!: string[];

  @Column({ type: "json", nullable: true })
  structuredData?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
