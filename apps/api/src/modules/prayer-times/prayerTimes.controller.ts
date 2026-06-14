import { Request, Response } from "express";
import { resolvePublicClientIp } from "../../helper/clientIp.js";
import {
  getPrayerTimesByCity,
  getPrayerTimesByCoordinates,
  getPrayerTimesNearIp,
  parseCoordinates,
  sanitizeLocationPart,
} from "./prayerTimes.service.js";

export async function getPrayerTimesNearMe(req: Request, res: Response) {
  try {
    const ip = resolvePublicClientIp(req.headers["x-forwarded-for"], req.ip || req.socket.remoteAddress);
    if (!ip) {
      return res.status(400).json({
        message: "Could not detect your location. Try searching by city instead.",
      });
    }

    const result = await getPrayerTimesNearIp(ip);
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("detect")
        ? error.message
        : "Could not load prayer times for your location. Try searching by city instead.";
    return res.status(502).json({ message });
  }
}

export async function getPrayerTimes(req: Request, res: Response) {
  try {
    const { city, country, latitude, longitude } = req.query;

    const coords = parseCoordinates(latitude, longitude);
    if (coords) {
      const result = await getPrayerTimesByCoordinates(coords.latitude, coords.longitude);
      return res.json(result);
    }

    const safeCity = sanitizeLocationPart(city);
    const safeCountry = sanitizeLocationPart(country);
    if (!safeCity || !safeCountry) {
      return res.status(400).json({
        message: "Provide city and country, or latitude and longitude.",
      });
    }

    const result = await getPrayerTimesByCity(safeCity, safeCountry);
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("unavailable")
        ? error.message
        : "Could not load prayer times. Try another location.";
    return res.status(502).json({ message });
  }
}
