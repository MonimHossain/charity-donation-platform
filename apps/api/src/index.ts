import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "http";
import morgan from "morgan";
import path from "path";
import { AppDataSource, connectDB } from "./helper/connectDB.js";
import { seedAdminUser } from "./modules/admin-auth/adminAuth.seed.js";
import { seedCampaigns } from "./modules/seed/seedCampaigns.js";
import { seedDonationPresets } from "./modules/seed/seedDonationPresets.js";
import { seedHomepageSections } from "./modules/seed/seedHomepageSections.js";
import { seedCharities } from "./modules/seed/seedCharities.js";
import { seedQuickDonate } from "./modules/seed/seedQuickDonate.js";
import { seedZakatPage } from "./modules/seed/seedZakatPage.js";
import { securityHeaders, csrfProtection, sanitizeInput } from "./modules/security/securityHeaders.js";
import { apiRateLimit } from "./modules/security/rateLimiter.js";
import routes from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT ?? "4000");

// Trust X-Forwarded-* from nginx so req.ip reflects the visitor, not 127.0.0.1
app.set("trust proxy", 1);

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "").toLowerCase();
}

function buildAllowedOrigins(): Set<string> {
  const configured = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.CORS_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);

  return new Set(configured);
}

app.set("views", path.join(import.meta.dirname ?? ".", "views"));

app.use(securityHeaders);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = buildAllowedOrigins();
      if (!origin || allowedOrigins.size === 0) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(csrfProtection);

app.post("/api/v1/payments/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const { handleWebhook } = await import("./modules/payments/stripe.controller.js");
    return handleWebhook(req, res);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
});

app.post("/api/v1/payments/paypal/webhook", express.json(), async (req, res) => {
  try {
    const { handlePayPalWebhook } = await import("./modules/payments/paypal.controller.js");
    return handlePayPalWebhook(req, res);
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
});

app.use(express.json({ limit: "10mb" }));
app.use(sanitizeInput);
app.use(morgan("dev"));
app.use(apiRateLimit);

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Charity Donation Platform API" });
});

app.use("/api/v1", routes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  await connectDB();
  try {
    await seedAdminUser();
    await seedCampaigns(AppDataSource);
    await seedDonationPresets(AppDataSource);
    await seedHomepageSections(AppDataSource);
    await seedCharities(AppDataSource);
    await seedQuickDonate(AppDataSource);
    await seedZakatPage(AppDataSource);
  } catch (error) {
    console.error("Seeding failed:", error);
  }
  try {
    const { ensureBucket } = await import("./helper/storage.js");
    await ensureBucket();
    console.log("MinIO bucket ready");
  } catch (error) {
    console.warn("MinIO bucket init skipped (MinIO may not be running):", (error as Error).message);
  }

  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  try {
    const { startAutomatedPaymentWorker } = await import("./modules/automated/automatedPayment.service.js");
    startAutomatedPaymentWorker();
  } catch (error) {
    console.warn("Automated payment worker not started:", (error as Error).message);
  }

  process.on("SIGTERM", () => {
    httpServer.close(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    httpServer.close(() => process.exit(0));
  });
};

startServer();
