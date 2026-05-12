import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { NewsletterSubscriber } from "../../components/newsletter/subscriber.entity.js";

export async function subscribe(req: Request, res: Response) {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const repo = AppDataSource.getRepository(NewsletterSubscriber);
    const existing = await repo.findOne({ where: { email } });
    if (existing) return res.json({ message: "Already subscribed" });

    const subscriber = repo.create({ email, name });
    await repo.save(subscriber);
    return res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSubscribers(req: Request, res: Response) {
  try {
    const subscribers = await AppDataSource.getRepository(NewsletterSubscriber).find({
      order: { subscribedAt: "DESC" },
    });
    return res.json(subscribers);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
