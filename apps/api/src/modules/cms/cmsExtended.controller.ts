import { Request, Response } from "express";
import { createEntity } from "../../helper/typeorm.js";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { NavigationMenu } from "../../components/cms/navigationMenu.entity.js";
import { Banner } from "../../components/cms/banner.entity.js";
import { Faq } from "../../components/cms/faq.entity.js";
import { MediaLibrary } from "../../components/cms/mediaLibrary.entity.js";
import { SeoSettings } from "../../components/cms/seoSettings.entity.js";
import { PageBlock } from "../../components/cms/pageBuilder.entity.js";
import { Translation } from "../../components/cms/translation.entity.js";
import { BlogCategory } from "../../components/blog/blogCategory.entity.js";
import { BlogPost } from "../../components/blog/blogPost.entity.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";

// ─── Navigation Menus ────────────────────────────────────────────────────────

export async function getNavigationMenus(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(NavigationMenu);
    const where: Record<string, any> = {};
    if (req.query.location) where.location = req.query.location;
    const menus = await repo.find({ where, order: { sortOrder: "ASC" } });
    return res.json(menus);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createNavigationMenu(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(NavigationMenu);
    const menu = createEntity(repo, req.body);
    await repo.save(menu);
    return res.status(201).json(menu);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateNavigationMenu(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(NavigationMenu);
    const menu = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!menu) return res.status(404).json({ message: "Menu item not found" });
    Object.assign(menu, req.body);
    await repo.save(menu);
    return res.json(menu);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteNavigationMenu(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(NavigationMenu).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Menu item not found" });
    return res.json({ message: "Menu item deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function reorderNavigationMenus(req: Request, res: Response) {
  try {
    const { items } = req.body;
    const repo = AppDataSource.getRepository(NavigationMenu);
    for (const { id, sortOrder } of items) {
      await repo.update(id, { sortOrder });
    }
    return res.json({ message: "Navigation menus reordered" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export async function getBanners(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Banner);
    const where: Record<string, any> = {};
    if (req.query.type) where.type = req.query.type;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === "true";
    const banners = await repo.find({ where, order: { sortOrder: "ASC" } });
    return res.json(banners);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

function isBannerWithinSchedule(banner: Banner, now = new Date()) {
  if (banner.startDate && new Date(banner.startDate) > now) return false;
  if (banner.endDate && new Date(banner.endDate) < now) return false;
  return true;
}

export async function getPublicBanners(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Banner);
    const where: Record<string, any> = { isActive: true };
    if (req.query.type) where.type = req.query.type;
    const banners = await repo.find({ where, order: { sortOrder: "ASC" } });
    const now = new Date();
    const active = banners.filter((b) => isBannerWithinSchedule(b, now));
    return res.json(active);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBanner(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Banner);
    const banner = createEntity(repo, req.body);
    await repo.save(banner);
    return res.status(201).json(banner);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBanner(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Banner);
    const banner = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    Object.assign(banner, req.body);
    await repo.save(banner);
    return res.json(banner);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBanner(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(Banner).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Banner not found" });
    return res.json({ message: "Banner deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── FAQs ────────────────────────────────────────────────────────────────────

export async function getFaqs(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Faq);
    const where: Record<string, any> = {};
    if (req.query.category) where.category = req.query.category;
    const faqs = await repo.find({ where, order: { sortOrder: "ASC" } });
    return res.json(faqs);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createFaq(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Faq);
    const faq = createEntity(repo, req.body);
    await repo.save(faq);
    return res.status(201).json(faq);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateFaq(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Faq);
    const faq = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    Object.assign(faq, req.body);
    await repo.save(faq);
    return res.json(faq);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteFaq(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(Faq).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "FAQ not found" });
    return res.json({ message: "FAQ deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── SEO Settings ────────────────────────────────────────────────────────────

export async function getSeoSettings(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(SeoSettings);
    const pagePath = req.query.pagePath as string;
    if (!pagePath) return res.status(400).json({ message: "pagePath query param is required" });
    const settings = await repo.findOne({ where: { pagePath } });
    if (!settings) return res.status(404).json({ message: "SEO settings not found for this page" });
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function upsertSeoSettings(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(SeoSettings);
    const { pagePath } = req.body;
    if (!pagePath) return res.status(400).json({ message: "pagePath is required" });
    let settings = await repo.findOne({ where: { pagePath } });
    if (settings) {
      Object.assign(settings, req.body);
    } else {
      settings = createEntity(repo, req.body);
    }
    await repo.save(settings);
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Page Blocks ─────────────────────────────────────────────────────────────

export async function getPageBlocks(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const where: Record<string, any> = {};
    if (req.query.pageType) where.pageType = req.query.pageType;
    if (req.query.pageId) where.pageId = req.query.pageId;
    const blocks = await repo.find({ where, order: { sortOrder: "ASC" } });
    return res.json(blocks);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createPageBlock(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const block = createEntity(repo, req.body);
    await repo.save(block);
    return res.status(201).json(block);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updatePageBlock(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const block = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!block) return res.status(404).json({ message: "Page block not found" });
    Object.assign(block, req.body);
    await repo.save(block);
    return res.json(block);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletePageBlock(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(PageBlock).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Page block not found" });
    return res.json({ message: "Page block deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function reorderPageBlocks(req: Request, res: Response) {
  try {
    const { items } = req.body;
    const repo = AppDataSource.getRepository(PageBlock);
    for (const { id, sortOrder } of items) {
      await repo.update(id, { sortOrder });
    }
    return res.json({ message: "Page blocks reordered" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Translations ────────────────────────────────────────────────────────────

export async function getTranslations(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Translation);
    const where: Record<string, any> = {};
    if (req.query.entityType) where.entityType = req.query.entityType;
    if (req.query.entityId) where.entityId = req.query.entityId;
    if (req.query.language) where.language = req.query.language;
    const translations = await repo.find({ where });
    return res.json(translations);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function upsertTranslation(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Translation);
    const { entityType, entityId, language, field } = req.body;
    if (!entityType || !entityId || !language || !field) {
      return res.status(400).json({ message: "entityType, entityId, language, and field are required" });
    }
    let translation = await repo.findOne({ where: { entityType, entityId, language, field } });
    if (translation) {
      Object.assign(translation, req.body);
    } else {
      translation = createEntity(repo, req.body);
    }
    await repo.save(translation);
    return res.json(translation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Media Library ───────────────────────────────────────────────────────────

export async function getMediaLibrary(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(MediaLibrary);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const where: Record<string, any> = {};
    if (req.query.folder) where.folder = req.query.folder;
    const [items, total] = await repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteMedia(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(MediaLibrary).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Media not found" });
    return res.json({ message: "Media deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Blog Categories ─────────────────────────────────────────────────────────

export async function getBlogCategories(_req: Request, res: Response) {
  try {
    const categories = await AppDataSource.getRepository(BlogCategory).find({
      where: { isActive: true },
      order: { sortOrder: "ASC" },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminBlogCategories(_req: Request, res: Response) {
  try {
    const categoryRepo = AppDataSource.getRepository(BlogCategory);
    const postRepo = AppDataSource.getRepository(BlogPost);

    const categories = await categoryRepo.find({
      order: { sortOrder: "ASC", name: "ASC" },
    });

    const counts = await postRepo
      .createQueryBuilder("post")
      .select("post.categoryId", "categoryId")
      .addSelect("COUNT(*)", "count")
      .where("post.categoryId IS NOT NULL")
      .groupBy("post.categoryId")
      .getRawMany<{ categoryId: string; count: string }>();

    const countByCategory = new Map(
      counts.map((row) => [row.categoryId, Number(row.count)])
    );

    const items = categories.map((category) => ({
      ...category,
      postCount: countByCategory.get(category.id) ?? 0,
    }));

    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBlogCategory(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(BlogCategory);
    const category = createEntity(repo, req.body);
    await repo.save(category);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBlogCategory(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(BlogCategory);
    const category = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    Object.assign(category, req.body);
    await repo.save(category);
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBlogCategory(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(BlogCategory).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Category not found" });
    return res.json({ message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function reorderBlogCategories(req: Request, res: Response) {
  try {
    const { items } = req.body;
    const repo = AppDataSource.getRepository(BlogCategory);
    for (const { id, sortOrder } of items) {
      await repo.update(id, { sortOrder });
    }
    return res.json({ message: "Blog categories reordered" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Footer Content ─────────────────────────────────────────────────────────

export async function getFooterContent(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    let settings = await repo.findOne({ where: {} });
    if (!settings) {
      return res.json({ footerContent: null });
    }
    return res.json({ footerContent: settings.footerContent ?? null });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateFooterContent(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    let settings = await repo.findOne({ where: {} });
    if (!settings) {
      settings = repo.create({ footerContent: req.body.footerContent });
    } else {
      settings.footerContent = req.body.footerContent;
    }
    await repo.save(settings);
    return res.json({ footerContent: settings.footerContent });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── CMS Pages (alias for page blocks grouped by page) ─────────────────────

export async function getPages(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const blocks = await repo.find({ order: { sortOrder: "ASC" } });
    const grouped: Record<string, { pageType: string; pageId: string | null; blocks: typeof blocks }> = {};
    for (const block of blocks) {
      const key = block.pageId ?? block.pageType;
      if (!grouped[key]) {
        grouped[key] = { pageType: block.pageType, pageId: block.pageId ?? null, blocks: [] };
      }
      grouped[key].blocks.push(block);
    }
    return res.json(Object.values(grouped));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletePage(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const result = await repo.delete({ pageId: routeParam(req, 'id') });
    if (result.affected === 0) return res.status(404).json({ message: "Page not found" });
    return res.json({ message: "Page deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function addBlockToPage(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const block = createEntity(repo, { ...req.body, pageId: routeParam(req, 'id')  });
    await repo.save(block);
    return res.status(201).json(block);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBlockInPage(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(PageBlock);
    const block = await repo.findOne({ where: { id: routeParam(req, 'blockId') } });
    if (!block) return res.status(404).json({ message: "Block not found" });
    Object.assign(block, req.body);
    await repo.save(block);
    return res.json(block);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBlockFromPage(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(PageBlock).delete(routeParam(req, 'blockId'));
    if (result.affected === 0) return res.status(404).json({ message: "Block not found" });
    return res.json({ message: "Block deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── SEO Stubs (redirects + sitemap-settings) ──────────────────────────────

export async function getRedirects(_req: Request, res: Response) {
  return res.json([]);
}

export async function createRedirect(_req: Request, res: Response) {
  return res.status(201).json({ message: "Redirect created (stub)" });
}

export async function deleteRedirect(_req: Request, res: Response) {
  return res.json({ message: "Redirect deleted (stub)" });
}

export async function getSitemapSettings(_req: Request, res: Response) {
  return res.json({});
}
