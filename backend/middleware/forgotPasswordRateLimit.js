import forgotLimiter from "../config/forgotLimiter.js";
import { rateLimitHits, rateLimitRequests } from "./metrics.js";

const forgotPasswordRateLimit = async (req, res, next) => {
  try {
    const { email } = req.body;
    const identifier = `forgot:${email}`;
    const { success } = await forgotLimiter.limit(identifier);

    rateLimitRequests.inc({
      type: "forgot_password",
      allowed: String(success),
    });

    if (!success) {
      rateLimitHits.inc({ type: "forgot_password" });
      return res.status(429).json({
        message: "Too many reset attempts. Try again later.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default forgotPasswordRateLimit;
