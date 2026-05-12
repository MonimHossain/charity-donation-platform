import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("media_library")
export class MediaLibrary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ type: "varchar", length: 255 })
  originalName!: string;

  @Column({ type: "varchar", length: 100 })
  mimeType!: string;

  @Column({ type: "int" })
  size!: number;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  alt?: string;

  @Column({ type: "varchar", length: 255, default: "/" })
  folder!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  uploadedBy?: string;

  @Column({ type: "int", nullable: true })
  width?: number;

  @Column({ type: "int", nullable: true })
  height?: number;

  @Column({ type: "json", default: [] })
  tags!: string[];

  @Column({ type: "varchar", length: 500, nullable: true })
  objectName?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
