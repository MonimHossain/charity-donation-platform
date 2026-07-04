import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("backup_history")
export class BackupHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ type: "bigint" })
  sizeBytes!: string;

  @Column({ type: "varchar", length: 20 })
  type!: "database" | "media";

  @CreateDateColumn()
  createdAt!: Date;
}
