import { Request, Response } from "express";
import {
  listBackupHistory,
  streamDatabaseBackup,
  streamMediaBackup,
} from "./backup.service.js";

export async function getBackupHistory(req: Request, res: Response) {
  try {
    const items = await listBackupHistory();
    res.json({
      items: items.map((b) => ({
        id: b.id,
        filename: b.filename,
        size: Number(b.sizeBytes),
        type: b.type,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error("getBackupHistory error:", error);
    res.status(500).json({ message: "Failed to load backup history" });
  }
}

export async function downloadDatabaseBackup(req: Request, res: Response) {
  try {
    await streamDatabaseBackup(res);
  } catch (error) {
    console.error("downloadDatabaseBackup error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to create database backup" });
    }
  }
}

export async function downloadMediaBackup(req: Request, res: Response) {
  try {
    await streamMediaBackup(res);
  } catch (error) {
    console.error("downloadMediaBackup error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to create media backup" });
    }
  }
}
