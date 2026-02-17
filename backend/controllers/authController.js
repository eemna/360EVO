import bcrypt from "bcryptjs";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { pool } from "../config/db.js";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken } 
from "../utils/tokenUtils.js";
import { sendEmail } from "../utils/email.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import jwt from "jsonwebtoken";


dotenv.config();


  // REGISTER



export const register = async (req, res, next) => {
  const client = await pool.connect();

   try {
    await client.query("BEGIN");

    const {
      name,
      email,
      password,
      role,
      companyName,
      stage,
      expertise,
      hourlyRate,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if email exists
    const userExists = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await client.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, name`,
      [email, hashedPassword, role, name]
    );

    const userId = newUser.rows[0].id;

    // STARTUP PROFILE
    if (role === "startup") {
      if (!companyName) {
        throw new Error("Company name is required for startups");
      }

      await client.query(
        `INSERT INTO startup_profiles (user_id, company_name, stage)
         VALUES ($1, $2, $3)`,
        [userId, companyName, stage || null]
      );
    }

    // EXPERT PROFILE
    if (role === "expert") {
      if (!expertise) {
        throw new Error("Expertise is required for experts");
      }

      await client.query(
        `INSERT INTO expert_profiles (user_id, expertise, hourly_rate)
         VALUES ($1, $2, $3)`,
        [userId, expertise, hourlyRate || null]
      );
    }

    // ✅ CREATE VERIFICATION TOKEN
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Delete old tokens
    await client.query(
      "DELETE FROM email_verifications WHERE user_id = $1",
      [userId]
    );

    // Insert new token
    await client.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [userId, verificationToken]
    );

    // ✅ Commit transaction
    await client.query("COMMIT");

    // Create verification link (AFTER COMMIT)
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    // Send email (outside transaction)
    try {
      await sendEmail({
        from: `"360EVO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your email",
        html: `
          <p>Click below to verify your email:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `,
      });
    } catch (mailError) {
      console.error("Email sending failed:", mailError.message);
    }

    res.status(201).json({
      user: newUser.rows[0],
      message:
        "Registration successful. Please check your email to verify your account.",
    });

       } catch (error) {
       await client.query("ROLLBACK");
       next(error);
       } finally {
        client.release();
       }
};



  // LOGIN

export const login = async (req, res, next) => {
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
};

  // VERIFY EMAIL

export const verifyEmail = async (req, res, next) => {
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
};



 //  FORGOT PASSWORD

export const forgotPassword = async (req, res, next) => {
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
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

   try {
  await sendEmail({
    from: `"360EVO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <p>Click below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  });
} catch (mailError) {
  console.error("Forgot password email failed:", mailError.message);
}


    res.json({ message: "Password reset link sent to your email" });

  }  catch (error) {
  next(error);
}
};

export const resendVerification = async (req, res, next) => {
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

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  


    await sendEmail({
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
};

export const refreshToken = async (req, res, next) => {
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
};



 //  RESET PASSWORD
export const resetPassword = async (req, res, next) => {
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
};


  // GET CURRENT USER
export const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

 //  LOGOUT
export const logout = async (req, res, next) => {
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
};


