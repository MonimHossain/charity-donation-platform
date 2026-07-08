import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { ExpenditureSettings } from "../../components/admin/expenditureSettings.entity.js";
import { logAudit } from "../../helper/auditLog.js";
import {
  computeExpenditureSummary,
  inputsFromEntity,
  normalizeMarketingDailyLog,
} from "./expenditureCalculations.js";

const SINGLETON_ID = "default";

const repo = () => AppDataSource.getRepository(ExpenditureSettings);

async function getOrCreateSettings(): Promise<ExpenditureSettings> {
  let row = await repo().findOne({ where: { id: SINGLETON_ID } });
  if (!row) {
    row = repo().create({
      id: SINGLETON_ID,
      employeeSalaryMonthly: "0",
      infrastructureMonthly: "0",
      operationsMonthly: "0",
      miscellaneousMonthly: "0",
      dailyMarketing: "0",
      marketingDailyLog: [],
      currency: "GBP",
      trackingStartDate: new Date().toISOString().slice(0, 10),
    });
    await repo().save(row);
  }
  if (!Array.isArray(row.marketingDailyLog)) {
    row.marketingDailyLog = [];
  }
  return row;
}

function serializeSettings(row: ExpenditureSettings) {
  const inputs = inputsFromEntity(row);
  const summary = computeExpenditureSummary(inputs, row.currency || "GBP");
  return {
    config: {
      employeeSalaryMonthly: inputs.employeeSalaryMonthly,
      infrastructureMonthly: inputs.infrastructureMonthly,
      operationsMonthly: inputs.operationsMonthly,
      miscellaneousMonthly: inputs.miscellaneousMonthly,
      marketingDailyLog: inputs.marketingDailyLog,
      trackingStartDate: row.trackingStartDate ?? null,
      currency: row.currency || "GBP",
      updatedAt: row.updatedAt,
    },
    summary,
  };
}

function parseMoney(value: unknown): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n) || n < 0) return "0";
  return n.toFixed(2);
}

function marketingLogToStorage(log: ReturnType<typeof normalizeMarketingDailyLog>) {
  return log.map((e) => ({ date: e.date, amount: e.amount.toFixed(2) }));
}

export async function getAdminExpenditures(_req: Request, res: Response) {
  try {
    const row = await getOrCreateSettings();
    return res.json(serializeSettings(row));
  } catch (error) {
    console.error("getAdminExpenditures error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminExpenditures(req: Request, res: Response) {
  try {
    const row = await getOrCreateSettings();
    const body = req.body as Record<string, unknown>;

    if (body.employeeSalaryMonthly !== undefined) {
      row.employeeSalaryMonthly = parseMoney(body.employeeSalaryMonthly);
    }
    if (body.infrastructureMonthly !== undefined) {
      row.infrastructureMonthly = parseMoney(body.infrastructureMonthly);
    }
    if (body.operationsMonthly !== undefined) {
      row.operationsMonthly = parseMoney(body.operationsMonthly);
    }
    if (body.miscellaneousMonthly !== undefined) {
      row.miscellaneousMonthly = parseMoney(body.miscellaneousMonthly);
    }
    if (body.marketingDailyLog !== undefined) {
      const normalized = normalizeMarketingDailyLog(body.marketingDailyLog);
      row.marketingDailyLog = marketingLogToStorage(normalized);
      row.dailyMarketing = "0";
    }
    if (body.trackingStartDate !== undefined) {
      const d = body.trackingStartDate;
      row.trackingStartDate =
        typeof d === "string" && d.trim() ? d.trim().slice(0, 10) : null;
    }
    if (body.currency !== undefined && typeof body.currency === "string") {
      row.currency = body.currency.trim().slice(0, 8) || "GBP";
    }

    await repo().save(row);
    await logAudit(req, {
      action: "update",
      entityType: "expenditure_settings",
      entityId: row.id,
      details: { updatedAt: row.updatedAt },
    });

    return res.json(serializeSettings(row));
  } catch (error) {
    console.error("updateAdminExpenditures error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
