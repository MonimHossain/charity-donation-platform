import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("blog_posts")
@Index("idx_blog_slug", ["slug"], { unique: true })
@Index("idx_blog_status", ["status"])
@Index("idx_blog_published", ["publishedAt"])
export class BlogPost {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 600, nullable: true })
  excerpt?: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  featuredImage?: string;

  @Column({ type: "varchar", length: 255, default: "Editorial Team" })
  author!: string;

  @Column({ type: "json", default: [] })
  tags!: string[];

  @Column({ type: "uuid", nullable: true })
  categoryId?: string;

  @Column({ type: "varchar", length: 220, nullable: true })
  metaTitle?: string;

  @Column({ type: "varchar", length: 320, nullable: true })
  metaDescription?: string;

  @Column({ type: "json", default: {} })
  seoSettings!: Record<string, unknown>;

  @Column({ type: "json", default: [] })
  faqs!: Array<{
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
    libraryFaqId?: string | null;
  }>;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status!: string;

  @Column({ type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "timestamp", nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
