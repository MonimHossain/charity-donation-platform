import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { ZakatPage, type ZakatFeatureCard } from "../../components/cms/zakatPage.entity.js";

const repo = () => AppDataSource.getRepository(ZakatPage);

export const DEFAULT_ZAKAT_FEATURE_CARDS: ZakatFeatureCard[] = [
  { title: "Food, shelter & medical care", description: "For families struggling to survive each day." },
  { title: "Children's education & clothing", description: "Sponsorship that brings dignity and stability." },
  { title: "Skills & livelihood projects", description: "Long-term relief that breaks the cycle of poverty." },
];

export function defaultZakatPagePayload(): Partial<ZakatPage> {
  return {
    heroEyebrow: "Zakat",
    heroTitle: "Give Zakat with confidence.",
    heroDescription:
      "Your Zakat helps poor families, widows, orphans and refugees — distributed transparently.",
    introHtml: "",
    featureCardsHeading: "What Zakat supports",
    featureCards: DEFAULT_ZAKAT_FEATURE_CARDS,
    contentBelowHtml: "",
    showQuote: true,
    status: "published",
  };
}

async function getOrCreateZakatPage(): Promise<ZakatPage> {
  const existing = await repo().findOne({ where: {}, order: { createdAt: "ASC" } });
  if (existing) return existing;
  const created = repo().create(defaultZakatPagePayload());
  return repo().save(created);
}

function serializePage(page: ZakatPage) {
  return {
    id: page.id,
    heroEyebrow: page.heroEyebrow,
    heroTitle: page.heroTitle,
    heroDescription: page.heroDescription,
    introHtml: page.introHtml,
    featureCardsHeading: page.featureCardsHeading,
    featureCards: page.featureCards ?? [],
    contentBelowHtml: page.contentBelowHtml,
    showQuote: page.showQuote,
    status: page.status,
    updatedAt: page.updatedAt,
  };
}

export async function getPublicZakatPage(_req: Request, res: Response) {
  try {
    const page = await getOrCreateZakatPage();
    if (page.status !== "published") {
      return res.status(404).json({ message: "Zakat page is not published" });
    }
    return res.json(serializePage(page));
  } catch (error) {
    console.error("getPublicZakatPage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminZakatPage(_req: Request, res: Response) {
  try {
    const page = await getOrCreateZakatPage();
    return res.json(serializePage(page));
  } catch (error) {
    console.error("getAdminZakatPage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateZakatPage(req: Request, res: Response) {
  try {
    const page = await getOrCreateZakatPage();
    const {
      heroEyebrow,
      heroTitle,
      heroDescription,
      introHtml,
      featureCardsHeading,
      featureCards,
      contentBelowHtml,
      showQuote,
      status,
    } = req.body;

    if (heroEyebrow !== undefined) page.heroEyebrow = String(heroEyebrow);
    if (heroTitle !== undefined) page.heroTitle = String(heroTitle);
    if (heroDescription !== undefined) page.heroDescription = String(heroDescription);
    if (introHtml !== undefined) page.introHtml = String(introHtml);
    if (featureCardsHeading !== undefined) page.featureCardsHeading = String(featureCardsHeading);
    if (featureCards !== undefined) {
      page.featureCards = Array.isArray(featureCards)
        ? featureCards.map((c: ZakatFeatureCard) => ({
            title: String(c.title ?? ""),
            description: String(c.description ?? ""),
          }))
        : [];
    }
    if (contentBelowHtml !== undefined) page.contentBelowHtml = String(contentBelowHtml);
    if (showQuote !== undefined) page.showQuote = Boolean(showQuote);
    if (status === "draft" || status === "published") page.status = status;

    await repo().save(page);
    return res.json(serializePage(page));
  } catch (error) {
    console.error("updateZakatPage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
