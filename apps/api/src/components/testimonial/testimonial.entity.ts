import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("testimonials")
export class Testimonial {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  role?: string;

  @Column({ type: "text" })
  quote!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: "int", default: 5 })
  rating!: number;

  @Column({ type: "boolean", default: true })
  isVisible!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
