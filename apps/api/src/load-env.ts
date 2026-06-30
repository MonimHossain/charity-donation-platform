import { config } from "dotenv";
import { resolve } from "path";

// Monorepo root .env — PM2 runs from apps/api and would otherwise load only apps/api/.env (often missing EMAIL_ENABLED).
config({ path: resolve(import.meta.dirname, "../../../.env") });
