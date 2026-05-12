import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("hero_slides")
export class HeroSlide {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 500 })
  subtitle!: string;

  @Column({ type: "varchar", length: 100 })
  ctaText!: string;

  @Column({ type: "varchar", length: 500 })
  ctaUrl!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  backgroundImage?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  backgroundVideo?: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  isVisible!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
