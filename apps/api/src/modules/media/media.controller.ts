import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { MediaLibrary } from "../../components/cms/mediaLibrary.entity.js";
import { uploadFile, deleteFile, deleteFiles, listFolders, ensureBucket, normalizeStoredMediaUrl } from "../../helper/storage.js";
import { logAudit } from "../../helper/auditLog.js";
import { ILike, In } from "typeorm";

const repo = () => AppDataSource.getRepository(MediaLibrary);

export async function getMediaFiles(req: Request, res: Response) {
  try {
    const {
      page = "1",
      limit = "30",
      folder,
      search,
      mimeType,
      tag,
      sort = "newest",
    } = req.query;

    const qb = repo().createQueryBuilder("m");
    if (folder && folder !== "/") {
      qb.andWhere("m.folder = :folder", { folder });
    }
    if (search) {
      qb.andWhere("(m.originalName ILIKE :s OR m.alt ILIKE :s OR m.filename ILIKE :s)", { s: `%${search}%` });
    }
    if (mimeType) {
      if (mimeType === "image") qb.andWhere("m.mimeType LIKE :mt", { mt: "image/%" });
      else if (mimeType === "video") qb.andWhere("m.mimeType LIKE :mt", { mt: "video/%" });
      else if (mimeType === "document") qb.andWhere("m.mimeType NOT LIKE :mi AND m.mimeType NOT LIKE :mv", { mi: "image/%", mv: "video/%" });
      else qb.andWhere("m.mimeType = :mt", { mt: mimeType });
    }

    if (sort === "oldest") qb.orderBy("m.createdAt", "ASC");
    else if (sort === "name") qb.orderBy("m.originalName", "ASC");
    else if (sort === "size") qb.orderBy("m.size", "DESC");
    else qb.orderBy("m.createdAt", "DESC");

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    qb.skip((pageNum - 1) * limitNum).take(limitNum);

    const [items, total] = await qb.getManyAndCount();

    const allFolders = await repo()
      .createQueryBuilder("m")
      .select("DISTINCT m.folder", "folder")
      .getRawMany();

    const folders = [...new Set(
      allFolders
        .map((r: any) => r.folder)
        .filter((f: string) => f && f !== "/")
    )].sort();

    const mapped = items.map((m) => ({
      id: m.id,
      name: m.originalName,
      filename: m.filename,
      url: normalizeStoredMediaUrl(m.url),
      thumbnailUrl: m.thumbnailUrl ? normalizeStoredMediaUrl(m.thumbnailUrl) : m.thumbnailUrl,
      type: m.mimeType,
      size: m.size,
      width: m.width,
      height: m.height,
      alt: m.alt,
      folder: m.folder,
      tags: m.tags,
      uploadedBy: m.uploadedBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return res.json({
      items: mapped,
      folders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getMediaFiles error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function uploadMediaFile(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const folder = (req.body.folder as string) || "/";
    const alt = (req.body.alt as string) || "";
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const admin = (req as any).admin;

    const result = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);

    let width: number | undefined;
    let height: number | undefined;
    if (file.mimetype.startsWith("image/")) {
      try {
        const { imageSize } = await import("image-size");
        const dims = imageSize(file.buffer);
        width = dims.width;
        height = dims.height;
      } catch {}
    }

    const media = repo().create({
      filename: result.objectName.split("/").pop()!,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: result.size,
      url: result.url,
      alt,
      folder,
      tags,
      objectName: result.objectName,
      uploadedBy: admin?.email || "system",
      width,
      height,
    });

    await repo().save(media);

    await logAudit(req, {
      action: "upload",
      entityType: "media",
      entityId: media.id,
      details: { filename: file.originalname, size: result.size, folder },
    });

    return res.status(201).json({
      id: media.id,
      name: media.originalName,
      filename: media.filename,
      url: normalizeStoredMediaUrl(media.url),
      type: media.mimeType,
      size: media.size,
      width: media.width,
      height: media.height,
      alt: media.alt,
      folder: media.folder,
      tags: media.tags,
      createdAt: media.createdAt,
    });
  } catch (error) {
    console.error("uploadMediaFile error:", error);
    return res.status(500).json({ message: "Failed to upload file" });
  }
}

export async function uploadMultipleFiles(req: Request, res: Response) {
  try {
    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const folder = (req.body.folder as string) || "/";
    const admin = (req as any).admin;
    const uploaded: any[] = [];

    for (const file of files) {
      const result = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);

      const media = repo().create({
        filename: result.objectName.split("/").pop()!,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: result.size,
        url: result.url,
        folder,
        objectName: result.objectName,
        uploadedBy: admin?.email || "system",
      });

      await repo().save(media);
      uploaded.push({
        id: media.id,
        name: media.originalName,
        url: media.url,
        type: media.mimeType,
        size: media.size,
      });
    }

    await logAudit(req, {
      action: "upload_batch",
      entityType: "media",
      details: { count: uploaded.length, folder },
    });

    return res.status(201).json({ uploaded, count: uploaded.length });
  } catch (error) {
    console.error("uploadMultipleFiles error:", error);
    return res.status(500).json({ message: "Failed to upload files" });
  }
}

export async function updateMediaFile(req: Request, res: Response) {
  try {
    const media = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!media) return res.status(404).json({ message: "File not found" });

    const { name, alt, folder, tags } = req.body;
    if (name) media.originalName = name;
    if (alt !== undefined) media.alt = alt;
    if (tags !== undefined) media.tags = tags;
    if (folder !== undefined && folder !== media.folder) {
      media.folder = folder;
    }

    await repo().save(media);

    await logAudit(req, {
      action: "update",
      entityType: "media",
      entityId: media.id,
      details: { filename: media.originalName },
    });

    return res.json({
      id: media.id,
      name: media.originalName,
      url: media.url,
      type: media.mimeType,
      size: media.size,
      alt: media.alt,
      folder: media.folder,
      tags: media.tags,
    });
  } catch (error) {
    console.error("updateMediaFile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteMediaFile(req: Request, res: Response) {
  try {
    const media = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!media) return res.status(404).json({ message: "File not found" });

    if (media.objectName) {
      try { await deleteFile(media.objectName); } catch (e) { console.error("Storage delete error:", e); }
    }

    await repo().delete(media.id);

    await logAudit(req, {
      action: "delete",
      entityType: "media",
      entityId: media.id,
      details: { filename: media.originalName },
    });

    return res.json({ message: "File deleted" });
  } catch (error) {
    console.error("deleteMediaFile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function bulkDeleteMedia(req: Request, res: Response) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No file IDs provided" });
    }

    const files = await repo().find({ where: { id: In(ids) } });

    const objectNames = files
      .map((f) => f.objectName)
      .filter(Boolean) as string[];

    if (objectNames.length > 0) {
      try { await deleteFiles(objectNames); } catch (e) { console.error("Bulk storage delete error:", e); }
    }

    await repo().delete(ids);

    await logAudit(req, {
      action: "bulk_delete",
      entityType: "media",
      details: { count: ids.length },
    });

    return res.json({ message: `${files.length} file(s) deleted`, deleted: files.length });
  } catch (error) {
    console.error("bulkDeleteMedia error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createFolder(req: Request, res: Response) {
  try {
    const { name, parent } = req.body;
    if (!name) return res.status(400).json({ message: "Folder name is required" });

    const folderPath = parent && parent !== "/"
      ? `${parent.replace(/^\/+|\/+$/g, "")}/${name}`
      : name;

    return res.status(201).json({ folder: folderPath, message: "Folder created" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function moveFiles(req: Request, res: Response) {
  try {
    const { ids, targetFolder } = req.body;
    if (!Array.isArray(ids) || !targetFolder) {
      return res.status(400).json({ message: "File IDs and target folder are required" });
    }

    await repo()
      .createQueryBuilder()
      .update(MediaLibrary)
      .set({ folder: targetFolder })
      .where("id IN (:...ids)", { ids })
      .execute();

    return res.json({ message: `${ids.length} file(s) moved to ${targetFolder}` });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMediaStats(_req: Request, res: Response) {
  try {
    const totalFiles = await repo().count();
    const sizeResult = await repo()
      .createQueryBuilder("m")
      .select("SUM(m.size)", "totalSize")
      .getRawOne();

    const typeBreakdown = await repo()
      .createQueryBuilder("m")
      .select("CASE WHEN m.mimeType LIKE 'image/%' THEN 'images' WHEN m.mimeType LIKE 'video/%' THEN 'videos' ELSE 'documents' END", "category")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(m.size)", "size")
      .groupBy("category")
      .getRawMany();

    return res.json({
      totalFiles,
      totalSize: Number(sizeResult?.totalSize || 0),
      breakdown: typeBreakdown.map((t: any) => ({
        category: t.category,
        count: Number(t.count),
        size: Number(t.size),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
