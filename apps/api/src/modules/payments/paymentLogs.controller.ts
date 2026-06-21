import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";

const repo = () => AppDataSource.getRepository(PaymentLog);

export async function getAdminPaymentLogs(req: Request, res: Response) {
  try {
    const {
      status,
      type,
      provider,
      donationId,
      page = "1",
      limit = "50",
      failedOnly,
    } = req.query;

    const qb = repo()
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.donation", "donation")
      .orderBy("p.createdAt", "DESC")
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit));

    if (donationId) {
      qb.andWhere("p.donationId = :donationId", { donationId });
    }
    if (status) {
      qb.andWhere("p.status = :status", { status });
    }
    if (type) {
      qb.andWhere("p.type = :type", { type });
    }
    if (provider) {
      qb.andWhere("p.provider = :provider", { provider });
    }
    if (failedOnly === "true" || failedOnly === "1") {
      qb.andWhere("(p.status IN (:...bad) OR p.type = :failedType)", {
        bad: ["failed", "pending", "cancelled"],
        failedType: "failed",
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return res.json({
      items: items.map((p) => ({
        id: p.id,
        donationId: p.donationId,
        recurringDonationId: p.recurringDonationId,
        type: p.type,
        provider: p.provider,
        providerTransactionId: p.providerTransactionId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        errorMessage: p.errorMessage,
        metadata: p.metadata,
        createdAt: p.createdAt,
        donorName: p.donation?.donorName,
        donorEmail: p.donation?.donorEmail,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("getAdminPaymentLogs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
