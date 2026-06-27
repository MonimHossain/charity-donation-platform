import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type ZakatFeatureCard = {
  title: string;
  description: string;
};

@Entity("zakat_page")
export class ZakatPage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, default: "Zakat" })
  heroEyebrow!: string;

  @Column({ type: "varchar", length: 500, default: "Give Zakat with confidence." })
  heroTitle!: string;

  @Column({ type: "text", default: "" })
  heroDescription!: string;

  @Column({ type: "text", default: "" })
  introHtml!: string;

  @Column({ type: "varchar", length: 255, default: "What Zakat supports" })
  featureCardsHeading!: string;

  @Column({ type: "json", default: [] })
  featureCards!: ZakatFeatureCard[];

  @Column({ type: "text", default: "" })
  contentBelowHtml!: string;

  @Column({ type: "boolean", default: true })
  showQuote!: boolean;

  @Column({ type: "varchar", length: 20, default: "published" })
  status!: "draft" | "published";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
