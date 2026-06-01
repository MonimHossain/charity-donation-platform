import type { DataSource } from "typeorm";
import { Charity } from "../../components/charity/charity.entity.js";
import { Certification } from "../../components/charity/certification.entity.js";

export async function seedCharities(ds: DataSource) {
  const charityRepo = ds.getRepository(Charity);
  const count = await charityRepo.count();
  if (count > 0) return;

  const hope = charityRepo.create({
    name: "Hope Relief International",
    slug: "hope-relief-international",
    country: "United Kingdom",
    logoUrl: "/images/logo-transparent.png",
    websiteUrl: "https://example.org",
    shortDescription: "UK-registered charity delivering emergency aid and sustainable development.",
    auditStatus: "passed",
    auditSummary: "Strong governance and transparent financial reporting.",
    auditDate: "2025-11-01",
    overallScore: 92,
    riskLevel: "low",
    scoreBreakdown: {
      financialTransparency: 94,
      governance: 90,
      programImpact: 91,
      ethicalFundraising: 92,
    },
    isFeatured: true,
    isPublished: true,
  });
  await charityRepo.save(hope);

  const water = charityRepo.create({
    name: "Water for Life Foundation",
    slug: "water-for-life-foundation",
    country: "United Kingdom",
    auditStatus: "passed",
    auditDate: "2025-08-20",
    isFeatured: true,
    isPublished: true,
  });
  await charityRepo.save(water);

  await charityRepo.save(
    charityRepo.create({
      name: "Global Ummah Aid",
      slug: "global-ummah-aid",
      country: "United Kingdom",
      auditStatus: "under_review",
      auditDate: "2026-01-15",
      isFeatured: false,
      isPublished: true,
    })
  );

  const certRepo = ds.getRepository(Certification);
  await certRepo.save(
    certRepo.create({
      charityId: hope.id,
      certificateId: "YIF-2025-001",
      status: "active",
      issueDate: "2025-11-01",
      expiryDate: "2026-11-01",
      certificationYear: 2025,
      badgeEnabled: true,
    })
  );
  await certRepo.save(
    certRepo.create({
      charityId: water.id,
      certificateId: "YIF-2025-042",
      status: "active",
      issueDate: "2025-08-20",
      expiryDate: "2026-08-20",
      certificationYear: 2025,
      badgeEnabled: true,
    })
  );

  console.log("Charities seeded.");
}
