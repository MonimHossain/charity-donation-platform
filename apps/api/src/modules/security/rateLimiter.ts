import { Request, Response, NextFunction } from "express";
import { resolveClientIp } from "../../helper/clientIp.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60000);

function requestPath(req: Request): string {
  return (req.originalUrl || req.url || req.path || "").split("?")[0];
}

function isRateLimitExempt(req: Request): boolean {
  if (req.method !== "GET") return false;
  const path = requestPath(req);
  return (
    path.startsWith("/api/v1/prayer-times") ||
    path.startsWith("/health") ||
    path === "/"
  );
}

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isRateLimitExempt(req)) {
      return next();
    }

    const ip = resolveClientIp(req.headers["x-forwarded-for"], req.ip || req.socket.remoteAddress);
    const key = `${ip}:${requestPath(req)}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
}

export const authRateLimit = rateLimit(10, 60000);
export const donationRateLimit = rateLimit(20, 60000);
export const apiRateLimit = rateLimit(200, 60000);
