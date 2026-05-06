import ratelimit from "../config/upstash.js";
import { rateLimitHits, rateLimitRequests } from "./metrics.js";

const rateLimiter = async (req, res, next) => {
  
  if (process.env.NODE_ENV === "e2e") {
    return next();
  }
  try {
    const identifier = req.ip;
    const { success } = await ratelimit.limit(identifier);

    rateLimitRequests.inc({ type: "global", allowed: String(success) });

    if (!success) {
      rateLimitHits.inc({ type: "global" });
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    console.log("Rate limit error", error);
    next(error);
  }
};

export default rateLimiter;
