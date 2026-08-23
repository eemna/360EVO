// Google reCAPTCHA v3 verification helper.
// Set RECAPTCHA_SECRET_KEY to enforce; when unset, verification is skipped
// (so local/dev keeps working).

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5;

export const verifyRecaptcha = async (token, expectedAction) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return { skipped: true };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const params = new URLSearchParams({ secret, response: token });
  const resp = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await resp.json();

  if (!data.success) {
    return {
      ok: false,
      reason: "verification_failed",
      errors: data["error-codes"],
    };
  }

  if (expectedAction && data.action && data.action !== expectedAction) {
    return { ok: false, reason: "action_mismatch" };
  }

  if (typeof data.score === "number" && data.score < MIN_SCORE) {
    return { ok: false, reason: "low_score", score: data.score };
  }

  return { ok: true, score: data.score };
};
