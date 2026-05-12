import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { ZakatCalculation } from "../../components/zakat/zakatCalculation.entity.js";

const repo = () => AppDataSource.getRepository(ZakatCalculation);

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;
const ZAKAT_RATE = 0.025;

export async function calculateZakat(req: Request, res: Response) {
  try {
    const {
      goldValue = 0,
      silverValue = 0,
      cashInHand = 0,
      cashInBank = 0,
      investments = 0,
      businessStock = 0,
      receivables = 0,
      property = 0,
      otherAssets = 0,
      personalDebt = 0,
      otherLiabilities = 0,
      currency = "GBP",
      goldPricePerGram,
      silverPricePerGram,
    } = req.body;

    const totalAssets =
      Number(goldValue) +
      Number(silverValue) +
      Number(cashInHand) +
      Number(cashInBank) +
      Number(investments) +
      Number(businessStock) +
      Number(receivables) +
      Number(property) +
      Number(otherAssets);

    const totalLiabilities = Number(personalDebt) + Number(otherLiabilities);
    const netWealth = totalAssets - totalLiabilities;

    const goldNisab = goldPricePerGram
      ? Number(goldPricePerGram) * NISAB_GOLD_GRAMS
      : 5000;
    const silverNisab = silverPricePerGram
      ? Number(silverPricePerGram) * NISAB_SILVER_GRAMS
      : 350;
    const nisabThreshold = Math.min(goldNisab, silverNisab);

    const isAboveNisab = netWealth >= nisabThreshold;
    const zakatPayable = isAboveNisab
      ? Math.round(netWealth * ZAKAT_RATE * 100) / 100
      : 0;

    return res.json({
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netWealth: Math.round(netWealth * 100) / 100,
      nisabThreshold: Math.round(nisabThreshold * 100) / 100,
      isAboveNisab,
      zakatPayable,
      currency,
      breakdown: {
        goldValue: Number(goldValue),
        silverValue: Number(silverValue),
        cashInHand: Number(cashInHand),
        cashInBank: Number(cashInBank),
        investments: Number(investments),
        businessStock: Number(businessStock),
        receivables: Number(receivables),
        property: Number(property),
        otherAssets: Number(otherAssets),
        personalDebt: Number(personalDebt),
        otherLiabilities: Number(otherLiabilities),
      },
    });
  } catch (error) {
    console.error("calculateZakat error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function saveZakatCalculation(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const calc = repo().create({
      ...req.body,
      userId: user?.id,
    });
    await repo().save(calc);
    return res.status(201).json(calc);
  } catch (error) {
    console.error("saveZakatCalculation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getZakatHistory(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const items = await repo().find({
      where: { userId: user.id },
      order: { createdAt: "DESC" },
      take: 20,
    });
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
