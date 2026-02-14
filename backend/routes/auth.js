import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { pool } from "../config/db.js";
import { protect } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

/* ===============================
   COOKIE CONFIG
================================= */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/* ===============================
   GENERATE JWT
================================= */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
};


/* ===============================
   REGISTER
================================= */
router.post(
  "/register",
  [
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
      return res.status(400).json({
      message: "All fields are required",
       });
      }

      // Check existing user
      const userExists = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, role, name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role, name`,
        [email, hashedPassword, role, name]
      );

      const userId = newUser.rows[0].id;

      // Create email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      // Delete old tokens for this user
      await pool.query(
       "DELETE FROM email_verifications WHERE user_id = $1",
         [userId]
        );

      await pool.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
        [userId, verificationToken]
      );
      // Create verification link
const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Send email
await transporter.sendMail({
  from: `"360EVO" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Verify your email",
  html: `
    <p>Click below to verify your email:</p>
    <a href="${verificationLink}">${verificationLink}</a>
  `,
});


      res.status(201).json({
        user: newUser.rows[0],
          message: "Registration successful. Please check your email to verify your account.",
      });
    } catch (error) {
  next(error);
}
  }
);

/* ===============================
   LOGIN
================================= */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      userData.password_hash
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!userData.is_verified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }
const accessToken = generateAccessToken(userData.id);
const refreshToken = generateRefreshToken(userData.id);

// Save refresh token in DB
await pool.query(
  `INSERT INTO sessions (user_id, token, expires_at, device_info)
   VALUES ($1, $2, NOW() + INTERVAL '30 days', $3)`,
  [userData.id, refreshToken, req.headers["user-agent"]]
);

// Send refresh token as httpOnly cookie
res.cookie("refreshToken", refreshToken, cookieOptions);

// Send access token in response
res.json({
  accessToken,
  user: {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: userData.name,
  },
});
} catch (error) {
  next(error);
}
});

/* ===============================
   VERIFY EMAIL
================================= */
router.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const result = await pool.query(
      "SELECT * FROM email_verifications WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const userId = result.rows[0].user_id;

    await pool.query(
      "UPDATE users SET is_verified = true WHERE id = $1",
      [userId]
    );

    await pool.query(
      "DELETE FROM email_verifications WHERE token = $1",
      [token]
    );

    res.json({ message: "Email verified successfully" });

  }catch (error) {
  next(error);
}
});



/* ===============================
   FORGOT PASSWORD
================================= */
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({ message: "If this email exists, a reset link has been sent" });

    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await pool.query(
    "DELETE FROM password_resets WHERE user_id = $1",
    [user.rows[0].id]
      );

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.rows[0].id, resetToken]
    );

    // ✅ Gmail transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        },
        tls: {
        rejectUnauthorized: false,
         },
        });


    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"360EVO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    res.json({ message: "Password reset link sent to your email" });

  }  catch (error) {
  next(error);
}
});

router.post("/resend-verification", async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = user.rows[0].id;

    // delete old tokens
    await pool.query(
      "DELETE FROM email_verifications WHERE user_id = $1",
      [userId]
    );

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [userId, verificationToken]
    );

    const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"360EVO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `
        <p>Click below to verify your email:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      `,
    });

    res.json({ message: "Verification email resent" });

  }catch (error) {
  next(error);
}
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // Check if refresh token exists in DB
    const session = await pool.query(
      "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
      [refreshToken]
    );

    if (session.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const newAccessToken = generateAccessToken(decoded.id);

    res.json({ accessToken: newAccessToken });

  } catch (error) {
    next(error);
  }
});



/* ===============================
   RESET PASSWORD
================================= */
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const userId = result.rows[0].user_id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, userId]
    );

    await pool.query(
      "DELETE FROM password_resets WHERE user_id = $1",
      [userId]
    );

    res.json({ message: "Password reset successful" });

  } catch (error) {
    next(error); // 👈 send error to global error handler
  }
});


/* ===============================
   GET CURRENT USER
================================= */
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

/* ===============================
   LOGOUT
================================= */
router.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await pool.query(
        "DELETE FROM sessions WHERE token = $1",
        [refreshToken]
      );
    }

    res.cookie("refreshToken", "", { ...cookieOptions, maxAge: 1 });

    res.json({ message: "Logged out successfully" });

  } catch (error) {
    next(error);
  }
});


export default router;
