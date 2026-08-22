import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

import "dotenv/config";

// Dedicated brute-force guard for /api/auth/login:
// 8 attempts per 15 minutes per identifier (email+IP).
const loginLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(8, "15 m"),
});

export default loginLimiter;
