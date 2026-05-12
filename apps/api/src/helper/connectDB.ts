import path from "path";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const isDistRuntime = dirname.split(path.sep).includes("dist");

const dbHost = process.env.DB_HOST ?? "localhost";
const dbPort = Number(process.env.DB_PORT ?? 54322);
const dbUser = process.env.DB_USERNAME ?? "admin";
const dbPassword = process.env.DB_PASSWORD ?? "admin123";
const dbName = process.env.DB_DATABASE ?? "charity_platform";
const dbSynchronize = (process.env.DB_SYNCHRONIZE ?? "true").toLowerCase() === "true";
const dbLogging = (process.env.DB_LOGGING ?? "false").toLowerCase() === "true";

const entitiesGlob = path.join(
  dirname,
  isDistRuntime ? "../components/**/*.entity.js" : "../components/**/*.entity.ts"
);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  database: dbName,
  synchronize: dbSynchronize,
  logging: dbLogging,
  entities: [entitiesGlob],
  migrations: ["src/migration/**/*.ts"],
  subscribers: [],
});

export const connectDB = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connection established.");
    }
  } catch (error: any) {
    console.error("Error during Data Source initialization:", error);
    if (error.code === "ECONNREFUSED") {
      console.error("Connection refused. Is PostgreSQL running?");
    }
  }
};
