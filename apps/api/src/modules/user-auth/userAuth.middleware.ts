import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.USER_JWT_SECRET ?? "user-jwt-secret-dev";

function readToken(req: Request): string | undefined {
  return req.cookies?.user_token || req.headers.authorization?.replace("Bearer ", "");
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Sets req.user when a valid token is present; continues anonymously otherwise. */
export function optionalUser(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}
