import forgotLimiter from "../config/forgotLimiter.js";

const forgotPasswordRateLimit = async (req, res, next) => {
  try {
    const { email } = req.body;

    const identifier = `forgot:${email}`;

    const { success } = await forgotLimiter.limit(identifier);

    if (!success) {
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
