import bcrypt from "bcryptjs";
import crypto from "crypto";
//import { validationResult } from "express-validator";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenUtils.js";
import { sendEmail } from "../utils/email.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

dotenv.config();

// REGISTER


export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, companyName, stage, expertise, hourlyRate } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    //  Ensure role is uppercase
    const normalizedRole = role.toUpperCase();

    if (!["MEMBER", "EXPERT", "STARTUP", "INVESTOR", "ADMIN"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Role specific validation
    if (normalizedRole === "STARTUP" && !companyName) {
      return res.status(400).json({
        message: "Company name is required for startups",
      });
    }

    if (normalizedRole === "EXPERT" && (!expertise || expertise.length === 0)) {
      return res.status(400).json({
        message: "Expertise is required for experts",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role: normalizedRole,
        },
      });

      //  Create ONLY ONE profile
      await tx.profile.create({
        data: {
          userId: createdUser.id,

          // Expert fields
          expertise: normalizedRole === "EXPERT"
          ? Array.isArray(expertise)
          ? expertise
          : [expertise]
          : [],


          hourlyRate:
            normalizedRole === "EXPERT" && hourlyRate
              ? new Prisma.Decimal(hourlyRate)
              : null,

          // Startup fields
          companyName: normalizedRole === "STARTUP" ? companyName : null,
          stage: normalizedRole === "STARTUP" ? stage || null : null,
        },
      });

      await tx.emailVerification.create({
        data: {
          userId: createdUser.id,
          token: verificationToken, //  correct field
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return createdUser;
    });

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

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });

  } catch (error) {
    next(error);
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

    const userData = await prisma.user.findUnique({
      where: { email },
    });

    if (
      !userData ||
      !(await bcrypt.compare(password, userData.passwordHash))
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!userData.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }

    if (userData.isSuspended) {
      return res.status(403).json({
        message: "Account is suspended",
      });
    }

    const accessToken = generateAccessToken(userData.id);
    const refreshToken = generateRefreshToken(userData.id);

    //  Hash refresh token before storing
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await prisma.refreshToken.create({
      data: {
        userId: userData.id,
        tokenHash: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);

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

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

//  FORGOT PASSWORD

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Prevent email enumeration
    if (!user) {
      return res.json({
        message: "If this email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    //  TRUE UPSERT (Required by task)
    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: hashedResetToken,
        expiresAt,
      },
      create: {
        userId: user.id,
        token: hashedResetToken,
        expiresAt,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      from: `"360EVO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    res.json({
      message: "If this email exists, a reset link has been sent",
    });

  } catch (error) {
    next(error);
  }
};


export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    await prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

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
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    //  HASH the incoming token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Check DB using hashed version
    const session = await prisma.refreshToken.findUnique({ where: { tokenHash: hashedToken } })


    if (!session) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(
      token,
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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    //  Correct field name
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
    });

    //  Check existence AND expiration
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: hashedPassword },
    });

    //  Since userId is unique, delete by userId OR token
    await prisma.passwordReset.delete({
      where: { userId: resetRecord.userId },
    });

    res.json({ message: "Password reset successful" });

  } catch (error) {
    next(error);
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
    const token = req.cookies.refreshToken;

    if (token) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      await prisma.refreshToken.delete({
        where: { tokenHash: hashedToken },
      });
    }

    res.cookie("refreshToken", "", {
      ...cookieOptions,
      maxAge: 1,
    });

    res.json({ message: "Logged out successfully" });

  } catch (error) {
    next(error);
  }
};


