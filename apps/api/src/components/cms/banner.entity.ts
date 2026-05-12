import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("banners")
export class Banner {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "varchar", length: 50 })
  type!: string;

  @Column({ type: "varchar", length: 50 })
  position!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  backgroundImage?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  backgroundColor?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  textColor?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  ctaText?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  ctaUrl?: string;

  @Column({ type: "timestamp", nullable: true })
  startDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  endDate?: Date;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "json", default: [] })
  showOnPages!: string[];

  @Column({ type: "boolean", default: true })
  dismissible!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
