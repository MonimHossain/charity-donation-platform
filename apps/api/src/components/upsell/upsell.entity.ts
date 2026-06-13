import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("upsells")
export class Upsell {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  image?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
