import type { Request } from "express";

/** Normalize Express 5 route params to a single string. */
export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
