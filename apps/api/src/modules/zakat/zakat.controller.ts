import { Request, Response } from "express";
import { createEntity } from "../../helper/typeorm.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { ZakatCalculation } from "../../components/zakat/zakatCalculation.entity.js";
import {
  getMetalPrices,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
} from "./metalPrices.service.js";

const repo = () => AppDataSource.getRepository(ZakatCalculation);

const ZAKAT_RATE = 0.025;

export async function getZakatMetalPrices(req: Request, res: Response) {
  try {
    const currency = typeof req.query.currency === "string" ? req.query.currency : "GBP";
    const prices = await getMetalPrices(currency);
    return res.json({
      ...prices,
      nisabGoldGrams: NISAB_GOLD_GRAMS,
      nisabSilverGrams: NISAB_SILVER_GRAMS,
      goldNisabValue: Math.round(prices.goldPricePerGram * NISAB_GOLD_GRAMS * 100) / 100,
      silverNisabValue: Math.round(prices.silverPricePerGram * NISAB_SILVER_GRAMS * 100) / 100,
    });
  } catch (error) {
    console.error("getZakatMetalPrices error:", error);
    return res.status(500).json({ message: "Unable to fetch metal prices" });
  }
}

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
      goldGrams,
      silverGrams,
      nisabBasis = "silver",
    } = req.body;

    let resolvedGoldPrice = Number(goldPricePerGram) || 0;
    let resolvedSilverPrice = Number(silverPricePerGram) || 0;

    if (!resolvedGoldPrice || !resolvedSilverPrice) {
      const live = await getMetalPrices(currency);
      resolvedGoldPrice = resolvedGoldPrice || live.goldPricePerGram;
      resolvedSilverPrice = resolvedSilverPrice || live.silverPricePerGram;
    }

    const computedGoldValue =
      Number(goldGrams) > 0
        ? Number(goldGrams) * resolvedGoldPrice
        : Number(goldValue);
    const computedSilverValue =
      Number(silverGrams) > 0
        ? Number(silverGrams) * resolvedSilverPrice
        : Number(silverValue);

    const totalAssets =
      computedGoldValue +
      computedSilverValue +
      Number(cashInHand) +
      Number(cashInBank) +
      Number(investments) +
      Number(businessStock) +
      Number(receivables) +
      Number(property) +
      Number(otherAssets);

    const totalLiabilities = Number(personalDebt) + Number(otherLiabilities);
    const netWealth = totalAssets - totalLiabilities;

    const goldNisab = resolvedGoldPrice * NISAB_GOLD_GRAMS;
    const silverNisab = resolvedSilverPrice * NISAB_SILVER_GRAMS;
    const basis = nisabBasis === "gold" ? "gold" : "silver";
    const nisabThreshold = basis === "gold" ? goldNisab : silverNisab;

    const isAboveNisab = netWealth >= nisabThreshold;
    const zakatPayable = isAboveNisab
      ? Math.round(netWealth * ZAKAT_RATE * 100) / 100
      : 0;

    return res.json({
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netWealth: Math.round(netWealth * 100) / 100,
      nisabThreshold: Math.round(nisabThreshold * 100) / 100,
      nisabBasis: basis,
      isAboveNisab,
      zakatPayable,
      currency,
      metalPrices: {
        goldPricePerGram: resolvedGoldPrice,
        silverPricePerGram: resolvedSilverPrice,
        goldNisabValue: Math.round(goldNisab * 100) / 100,
        silverNisabValue: Math.round(silverNisab * 100) / 100,
        nisabGoldGrams: NISAB_GOLD_GRAMS,
        nisabSilverGrams: NISAB_SILVER_GRAMS,
      },
      breakdown: {
        goldValue: computedGoldValue,
        silverValue: computedSilverValue,
        goldGrams: Number(goldGrams) || 0,
        silverGrams: Number(silverGrams) || 0,
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
    const calc = createEntity(repo(), { ...req.body,
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
