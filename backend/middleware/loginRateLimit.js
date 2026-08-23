import loginLimiter from "../config/loginLimiter.js";

// Per-email+IP login throttling — closes credential-stuffing windows that
// the global per-IP limiter (50/15m) leaves open.
const loginRateLimit = async (req, res, next) => {
  if (process.env.NODE_ENV === "e2e") {
    return next();
  }
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "unknown";
    const identifier = `login:${email}:${req.ip}`;
    const { success } = await loginLimiter.limit(identifier);

    if (!success) {
      return res.status(429).json({
        message:
          "Too many login attempts for this account. Please try again in 15 minutes.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default loginRateLimit;
