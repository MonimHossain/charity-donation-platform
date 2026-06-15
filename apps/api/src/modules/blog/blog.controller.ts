import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { BlogPost } from "../../components/blog/blogPost.entity.js";
import { BlogCategory } from "../../components/blog/blogCategory.entity.js";
import { In } from "typeorm";
import { logAudit } from "../../helper/auditLog.js";
import { normalizeOptionalMediaUrl, normalizeStoredMediaUrl } from "../../helper/storage.js";

const repo = () => AppDataSource.getRepository(BlogPost);
const categoryRepo = () => AppDataSource.getRepository(BlogCategory);

async function categoryMapForPosts(posts: BlogPost[]) {
  const categoryIds = [...new Set(posts.map((post) => post.categoryId).filter(Boolean))] as string[];
  if (!categoryIds.length) return new Map<string, BlogCategory>();

  const categories = await categoryRepo().find({
    where: { id: In(categoryIds) },
  });
  return new Map(categories.map((category) => [category.id, category]));
}

function mapBlogListItem(post: BlogPost, category?: BlogCategory | null) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: normalizeOptionalMediaUrl(post.featuredImage),
    author: post.author,
    tags: post.tags,
    categoryId: post.categoryId ?? null,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    status: post.status,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await repo().findOne({ where: { slug: candidate } });
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    suffix++;
  }
}

// ═══════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════

export async function getPublicBlogPosts(req: Request, res: Response) {
  try {
    const { tag, search, categoryId, page = "1", limit = "12" } = req.query;
    const qb = repo()
      .createQueryBuilder("post")
      .where("post.status = :status", { status: "published" })
      .andWhere("post.publishedAt IS NOT NULL");

    if (search) {
      qb.andWhere("(post.title ILIKE :search OR post.excerpt ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    if (tag) {
      qb.andWhere("post.tags ::jsonb @> :tag", { tag: JSON.stringify([tag]) });
    }

    if (categoryId && typeof categoryId === "string") {
      qb.andWhere("post.categoryId = :categoryId", { categoryId });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [items, total] = await qb
      .orderBy("post.publishedAt", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    const categories = await categoryMapForPosts(items);

    return res.json({
      items: items.map((post) => mapBlogListItem(post, post.categoryId ? categories.get(post.categoryId) : null)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getPublicBlogPosts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPublicBlogPost(req: Request, res: Response) {
  try {
    const post = await repo().findOne({
      where: { slug: routeParam(req, 'slug'), status: "published" },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const category = post.categoryId
      ? await categoryRepo().findOne({ where: { id: post.categoryId } })
      : null;

    return res.json({
      ...post,
      featuredImage: normalizeOptionalMediaUrl(post.featuredImage),
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
    });
  } catch (error) {
    console.error("getPublicBlogPost error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ═══════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════

export async function getAdminBlogPosts(req: Request, res: Response) {
  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const qb = repo().createQueryBuilder("post");

    if (status && status !== "all") {
      qb.where("post.status = :status", { status });
    }

    if (search) {
      qb.andWhere("(post.title ILIKE :search OR post.excerpt ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [items, total] = await qb
      .orderBy("post.createdAt", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    const categories = await categoryMapForPosts(items);

    return res.json({
      items: items.map((post) => mapBlogListItem(post, post.categoryId ? categories.get(post.categoryId) : null)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getAdminBlogPosts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminBlogPost(req: Request, res: Response) {
  try {
    const post = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({
      ...post,
      featuredImage: normalizeOptionalMediaUrl(post.featuredImage),
    });
  } catch (error) {
    console.error("getAdminBlogPost error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBlogPost(req: Request, res: Response) {
  try {
    const {
      title,
      excerpt,
      content,
      featuredImage,
      author,
      tags,
      status,
      metaTitle,
      metaDescription,
      isFeatured,
      categoryId,
      publishedAt,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const slug = await ensureUniqueSlug(title);
    const resolvedStatus = status || "draft";
    const post = repo().create({
      title,
      slug,
      excerpt: excerpt || "",
      content,
      featuredImage: featuredImage ? normalizeStoredMediaUrl(featuredImage) : null,
      author: author || "Editorial Team",
      tags: tags || [],
      categoryId: categoryId || null,
      status: resolvedStatus,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      isFeatured: isFeatured || false,
      publishedAt: publishedAt
        ? new Date(publishedAt)
        : resolvedStatus === "published"
          ? new Date()
          : undefined,
    });

    await repo().save(post);
    await logAudit(req, {
      action: "create",
      entityType: "blog_post",
      entityId: post.id,
      details: { title: post.title },
    });
    return res.status(201).json(post);
  } catch (error) {
    console.error("createBlogPost error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBlogPost(req: Request, res: Response) {
  try {
    const post = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const {
      title,
      excerpt,
      content,
      featuredImage,
      author,
      tags,
      status,
      metaTitle,
      metaDescription,
      isFeatured,
      categoryId,
      publishedAt,
    } = req.body;

    if (title && title !== post.title) {
      post.slug = await ensureUniqueSlug(title, post.id);
      post.title = title;
    }

    if (excerpt !== undefined) post.excerpt = excerpt;
    if (content !== undefined) post.content = content;
    if (featuredImage !== undefined) {
      post.featuredImage = featuredImage ? normalizeStoredMediaUrl(featuredImage) : undefined;
    }
    if (author !== undefined) post.author = author;
    if (tags !== undefined) post.tags = tags;
    if (metaTitle !== undefined) post.metaTitle = metaTitle;
    if (metaDescription !== undefined) post.metaDescription = metaDescription;
    if (isFeatured !== undefined) post.isFeatured = isFeatured;
    if (categoryId !== undefined) post.categoryId = categoryId || null;

    if (publishedAt !== undefined) {
      post.publishedAt = publishedAt ? new Date(publishedAt) : undefined;
    }

    if (status !== undefined) {
      const wasPublished = post.status === "published";
      post.status = status;
      if (status === "published" && !wasPublished && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }

    await repo().save(post);
    await logAudit(req, {
      action: "update",
      entityType: "blog_post",
      entityId: post.id,
      details: { title: post.title },
    });
    return res.json(post);
  } catch (error) {
    console.error("updateBlogPost error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBlogPost(req: Request, res: Response) {
  try {
    const result = await repo().delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Post not found" });
    await logAudit(req, {
      action: "delete",
      entityType: "blog_post",
      entityId: routeParam(req, 'id'),
    });
    return res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("deleteBlogPost error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Keep backwards-compatible aliases
export { getPublicBlogPosts as getBlogPosts, getPublicBlogPost as getBlogPostBySlug };
