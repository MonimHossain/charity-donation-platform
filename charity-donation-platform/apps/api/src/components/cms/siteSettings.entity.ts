import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("site_settings")
export class SiteSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, default: "Charity Platform" })
  siteName!: string;

  @Column({ type: "text", default: "" })
  siteDescription!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  faviconUrl?: string;

  @Column({ type: "varchar", length: 100, default: "" })
  charityRegNumber!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  contactEmail!: string;

  @Column({ type: "varchar", length: 50, default: "" })
  contactPhone!: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "json", default: {} })
  socialLinks!: Record<string, string>;

  @Column({ type: "text", default: "100% Donation Policy" })
  donationPolicy!: string;

  @Column({ type: "json", default: [] })
  trustBadges!: Array<{ label: string; icon?: string }>;

  @Column({ type: "json", default: {} })
  stickyBarConfig!: Record<string, unknown>;

  @Column({ type: "json", nullable: true })
  footerContent?: {
    aboutText?: string;
    copyrightText?: string;
    columns?: Array<{
      title: string;
      links: Array<{ label: string; url: string }>;
    }>;
  };

  @Column({ type: "varchar", length: 100, nullable: true })
  gtmId?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  analyticsId?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  defaultLanguage?: string;

  @Column({ type: "json", default: ["en"] })
  enabledLanguages!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
