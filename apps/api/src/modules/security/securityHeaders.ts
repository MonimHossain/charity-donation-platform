import { Request, Response, NextFunction } from "express";

function buildContentSecurityPolicy(): string {
  const sgtmHost = process.env.NEXT_PUBLIC_SGTM_HOST?.trim().replace(/\/+$/, "");
  const sgtmOrigin = sgtmHost ? ` https://${sgtmHost}` : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com https://www.googletagmanager.com${sgtmOrigin}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `frame-src https://js.stripe.com https://www.paypal.com https://secure.telr.com https://secure.paytabs.com https://secure-egypt.paytabs.com${sgtmOrigin}`,
    `connect-src 'self' https://api.stripe.com https://www.paypal.com https://secure.telr.com https://secure.paytabs.com${sgtmOrigin}`,
  ].join("; ");
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", buildContentSecurityPolicy());
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
    process.env.CORS_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value));

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
