import { Request, Response, NextFunction } from "express";

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; frame-src https://js.stripe.com https://www.paypal.com; connect-src 'self' https://api.stripe.com https://www.paypal.com"
  );
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) {
    return next();
  }

  const allowedOrigins = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean).map((o) => new URL(o!).origin);

  const requestOrigin = origin || (referer ? new URL(referer).origin : "");

  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    return res.status(403).json({ message: "CSRF validation failed" });
  }

  next();
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  function sanitize(obj: any): any {
    if (typeof obj === "string") {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  }

  if (req.body) req.body = sanitize(req.body);
  next();
}
