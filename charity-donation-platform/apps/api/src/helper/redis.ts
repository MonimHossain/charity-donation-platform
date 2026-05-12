import Redis from "ioredis";

const redisPort = Number(process.env.REDIS_PORT ?? 63793);

export const redis = new Redis({
  host: "127.0.0.1",
  port: redisPort,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));
