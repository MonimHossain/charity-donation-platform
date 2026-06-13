import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Upsell } from "../../components/upsell/upsell.entity.js";

const repo = () => AppDataSource.getRepository(Upsell);

export async function getAdminUpsells(_req: Request, res: Response) {
  try {
    const items = await repo().find({
      order: { sortOrder: "ASC", createdAt: "DESC" },
    });
    return res.json({ items });
  } catch (error) {
    console.error("getAdminUpsells error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUpsell(req: Request, res: Response) {
  try {
    const { name, description, image, amount, sortOrder, isActive } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: "A valid amount is required" });
    }

    const count = await repo().count();
    const upsell = repo().create({
      name: String(name).trim(),
      description: String(description ?? ""),
      image: image || undefined,
      amount: parsedAmount,
      sortOrder: sortOrder ?? count,
      isActive: isActive !== false,
    });
    await repo().save(upsell);
    return res.status(201).json(upsell);
  } catch (error) {
    console.error("createUpsell error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUpsell(req: Request, res: Response) {
  try {
    const upsell = await repo().findOne({ where: { id: req.params.id } });
    if (!upsell) return res.status(404).json({ message: "Upsell not found" });

    const { name, description, image, amount, sortOrder, isActive } = req.body;
    if (name !== undefined) upsell.name = String(name).trim();
    if (description !== undefined) upsell.description = String(description);
    if (image !== undefined) upsell.image = image || undefined;
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ message: "A valid amount is required" });
      }
      upsell.amount = parsedAmount;
    }
    if (sortOrder !== undefined) upsell.sortOrder = Number(sortOrder);
    if (isActive !== undefined) upsell.isActive = Boolean(isActive);

    await repo().save(upsell);
    return res.json(upsell);
  } catch (error) {
    console.error("updateUpsell error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUpsell(req: Request, res: Response) {
  try {
    const result = await repo().delete(req.params.id);
    if (!result.affected) return res.status(404).json({ message: "Upsell not found" });
    return res.json({ message: "Upsell deleted" });
  } catch (error) {
    console.error("deleteUpsell error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
