import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("page_blocks")
export class PageBlock {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  pageType!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  pageId?: string;

  @Column({ type: "varchar", length: 50 })
  blockType!: string;

  @Column({ type: "json" })
  content!: Record<string, any>;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  isVisible!: boolean;

  @Column({ type: "json", nullable: true })
  settings?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
