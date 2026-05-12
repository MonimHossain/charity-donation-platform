import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("navigation_menus")
export class NavigationMenu {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  label!: string;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  @Column({ type: "varchar", length: 50, default: "header" })
  location!: string;

  @Column({ type: "uuid", nullable: true })
  parentId?: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  isVisible!: boolean;

  @Column({ type: "varchar", length: 50, nullable: true })
  target?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  icon?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
