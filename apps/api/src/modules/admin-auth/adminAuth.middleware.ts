import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "change-me";

function extractBearerToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.admin_token;
  if (cookieToken && typeof cookieToken === "string") {
    return cookieToken.trim();
  }

  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return undefined;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return (match?.[1] ?? header).trim();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (token === "demo-admin-token" || token.split(".").length !== 3) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
