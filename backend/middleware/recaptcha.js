import { verifyRecaptcha } from "../utils/recaptcha.js";

// Enforces reCAPTCHA v3 on a route. Expects { recaptchaToken } in req.body.
// No-ops when RECAPTCHA_SECRET_KEY is not configured.
export const requireRecaptcha = (action) => {
  return async (req, res, next) => {
    try {
      const result = await verifyRecaptcha(req.body?.recaptchaToken, action);

      if (result.skipped) {
        return next();
      }

      if (!result.ok) {
        console.log(
          `reCAPTCHA rejected (${action}):`,
          result.reason,
          result.score ?? "",
        );
        return res.status(400).json({
          message: "Security check failed. Please try again.",
        });
      }

      next();
    } catch (error) {
      console.error("reCAPTCHA verification error:", error.message);
      // Fail closed: if Google is unreachable we cannot verify humanity.
      return res.status(503).json({
        message: "Security check unavailable. Please try again shortly.",
      });
    }
  };
};
