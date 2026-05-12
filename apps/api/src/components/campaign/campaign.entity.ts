import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// ── JSON column type definitions ──

export interface SinglePaymentConfig {
  priceType: "preset" | "custom" | "both";
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
}

export interface RegularPresetAmount {
  amount: number;
  cause: string;
  defaultDuration?: number;
}

export interface RegularPaymentConfig {
  allowedIntervals: string[];
  durationType: "never_ends" | "fixed_duration";
  fixedDurationValue?: number;
  fixedDurationType?: "months" | "payments" | "date";
  endDate?: string;
  presetAmounts: RegularPresetAmount[];
  allowCustomAmount: boolean;
  customMinAmount: number;
  customMaxAmount: number;
}

export interface QuantityConfig {
  quantityLabel: string;
  minQuantity: number;
  maxQuantity: number;
}

export interface CustomField {
  id: string;
  fieldType: "text" | "textarea" | "dropdown" | "radio" | "checkbox" | "number" | "date";
  label: string;
  placeholder: string;
  isRequired: boolean;
  defaultValue: string;
  sortOrder: number;
  options: string[];
  conditionalVisibility?: { dependsOnField: string; dependsOnValue: string };
}

export interface CampaignAttribute {
  id: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
  enableSinglePayment: boolean;
  enableRegularPayment: boolean;
  enableQuantity: boolean;
  singlePaymentConfig: SinglePaymentConfig;
  regularPaymentConfig: RegularPaymentConfig;
  quantityConfig: QuantityConfig;
  customFields: CustomField[];
}

export interface CampaignUpsell {
  id: string;
  label: string;
  amount: number;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FundraiserSettings {
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  showProgressBar: boolean;
  autoCloseAfterDeadline: boolean;
  allowOverfunding: boolean;
}

export interface CheckoutSettings {
  allowAnonymous: boolean;
  enableGiftAid: boolean;
  enableDedication: boolean;
  enableComments: boolean;
  enableUpsell: boolean;
  enableFeeCoverage: boolean;
}

export interface VisibilitySettings {
  showInHeader: boolean;
  showOnHomepage: boolean;
  pinToTop: boolean;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

export type CampaignMode = "standard" | "fundraiser" | "sponsorship" | "zakat" | "automated";

@Entity("campaigns")
export class Campaign {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  shortDescription!: string;

  @Column({ type: "text", default: "" })
  fullDescription!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  thumbnail?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  banner?: string;

  @Column({ type: "varchar", length: 50, default: "general" })
  category!: string;

  @Column({ type: "json", default: [] })
  tags!: string[];

  @Column({ type: "varchar", length: 20, default: "draft" })
  status!: string;

  @Column({ type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ type: "boolean", default: false })
  isUrgent!: boolean;

  @Column({ type: "varchar", length: 20, default: "standard" })
  campaignMode!: CampaignMode;

  @Column({ type: "json", default: [] })
  attributes!: CampaignAttribute[];

  @Column({ type: "json", default: [] })
  upsells!: CampaignUpsell[];

  @Column({
    type: "json",
    default: {
      targetAmount: 0,
      raisedAmount: 0,
      startDate: "",
      endDate: "",
      showProgressBar: true,
      autoCloseAfterDeadline: false,
      allowOverfunding: true,
    },
  })
  fundraiserSettings!: FundraiserSettings;

  @Column({
    type: "json",
    default: {
      allowAnonymous: true,
      enableGiftAid: false,
      enableDedication: false,
      enableComments: false,
      enableUpsell: false,
      enableFeeCoverage: false,
    },
  })
  checkoutSettings!: CheckoutSettings;

  @Column({
    type: "json",
    default: {
      showInHeader: false,
      showOnHomepage: false,
      pinToTop: false,
    },
  })
  visibilitySettings!: VisibilitySettings;

  @Column({ type: "json", default: [] })
  paymentGateways!: string[];

  @Column({
    type: "json",
    default: {
      metaTitle: "",
      metaDescription: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
    },
  })
  seoSettings!: SeoSettings;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  currency!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "int", default: 0 })
  donorCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
