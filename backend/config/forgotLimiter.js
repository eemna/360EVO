import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const forgotLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

export default forgotLimiter;
