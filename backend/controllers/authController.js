import bcrypt from "bcryptjs";
import crypto from "crypto";
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

    if (
      !["MEMBER", "EXPERT", "STARTUP", "INVESTOR", "ADMIN"].includes(
        normalizedRole,
      )
    ) {
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
          expertise:
            normalizedRole === "EXPERT"
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

    sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
    <p>Click below to verify your email:</p>
    <a href="${verificationLink}">${verificationLink}</a>
  `,
    }).catch((err) => console.error("Email failed:", err));

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
      include: {
        profile: true,
      },
    });

    if (!userData || !(await bcrypt.compare(password, userData.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!userData.isVerified) {
      return res.status(403).json({
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
        profile: userData.profile,
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

    sendEmail({
      to: email,
      subject: "Reset your password",
      html: `
    <p>Click below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a>
  `,
    }).catch((err) => console.error("Email failed:", err));

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

    sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
    <p>Click below to verify your email:</p>
    <a href="${verificationLink}">${verificationLink}</a>
  `,
    }).catch((err) => console.error("Email failed:", err));

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
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Check DB using hashed version
    const session = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashedToken },
    });

    if (!session) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

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

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

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
    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    if (!user.profile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
        },
      });

      user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
      });
    }

    res.json(user);
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
// CHANGE PASSWORD (Logged in user)
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email, isVerified: false },
    });

    res.json({ message: "Email updated. Please verify again." });
  } catch (error) {
    next(error);
  }
};
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      name,
      bio,
      avatar,
      phone,
      location,
      linkedIn,
      companyName,
      stage,
      hourlyRate,
      expertise,
      industries,
      certifications,
      yearsOfExperience,
      availabilityStatus,
      weeklyAvailability,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Update user only if name provided
      if (name !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { name },
        });
      }

      const profileData = {};

      if (bio !== undefined) profileData.bio = bio;
      if (avatar !== undefined) profileData.avatar = avatar;
      if (phone !== undefined) profileData.phone = phone;
      if (location !== undefined) profileData.location = location;
      if (linkedIn !== undefined) profileData.linkedIn = linkedIn;
      if (companyName !== undefined) profileData.companyName = companyName;
      if (stage !== undefined) profileData.stage = stage;

      if (hourlyRate !== undefined) {
        profileData.hourlyRate =
          hourlyRate !== null ? Number(hourlyRate) : null;
      }

      if (yearsOfExperience !== undefined)
        profileData.yearsOfExperience = yearsOfExperience;

      if (availabilityStatus !== undefined)
        profileData.availabilityStatus = availabilityStatus;

      if (Array.isArray(expertise)) profileData.expertise = expertise;

      if (Array.isArray(industries)) profileData.industries = industries;

      if (Array.isArray(certifications))
        profileData.certifications = certifications;

      const profile = await tx.profile.upsert({
        where: { userId },
        update: profileData,
        create: {
          userId,
          ...profileData,
        },
      });

      if (Array.isArray(weeklyAvailability)) {
        await tx.weeklyAvailability.deleteMany({
          where: { profileId: profile.id },
        });
        const validAvailability = weeklyAvailability.filter(
          (d) => d.enabled && d.startTime && d.endTime,
        );

        if (validAvailability.length) {
          await tx.weeklyAvailability.createMany({
            data: validAvailability.map((day) => ({
              profileId: profile.id,
              day: day.day,
              startTime: day.startTime,
              endTime: day.endTime,
              enabled: true,
            })),
          });
        }
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              weeklyAvailability: true,
            },
          },
        },
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
// GET /api/experts/:id
export const getPublicExpertProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expert = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            weeklyAvailability: true,
          },
        },
      },
    });

    if (!expert || expert.role !== "EXPERT") {
      return res.status(404).json({ message: "Expert not found" });
    }

    let computedStatus = "AVAILABLE";

    //  Manual override
    if (expert.profile?.availabilityStatus === "ON_LEAVE") {
      computedStatus = "ON_LEAVE";
    } else {
      const today = new Date();
      const todayDay = today.getDay();

      const todayAvailability = expert.profile.weeklyAvailability.find(
        (slot) => slot.day === todayDay && slot.enabled,
      );

      if (!todayAvailability) {
        computedStatus = "BUSY";
      } else {
        // Check if fully booked today
        const [startHour, startMinute] = todayAvailability.startTime
          .split(":")
          .map(Number);

        const [endHour, endMinute] = todayAvailability.endTime
          .split(":")
          .map(Number);

        const availableStart = new Date(today);
        availableStart.setHours(startHour, startMinute, 0, 0);

        const availableEnd = new Date(today);
        availableEnd.setHours(endHour, endMinute, 0, 0);

        const bookingsToday = await prisma.booking.findMany({
          where: {
            expertId: expert.id,
            status: { in: ["PENDING", "ACCEPTED"] },
            startDateTime: {
              gte: availableStart,
              lt: availableEnd,
            },
          },
        });

        const bookedMinutes = bookingsToday.reduce(
          (total, booking) => total + booking.duration,
          0,
        );

        const totalAvailableMinutes =
          (availableEnd - availableStart) / (1000 * 60);

        if (bookedMinutes >= totalAvailableMinutes) {
          computedStatus = "BUSY";
        }
      }
    }

    res.json({
      ...expert,
      computedStatus,
    });
  } catch (error) {
    next(error);
  }
};
export const createBooking = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const { expertId, date, timeSlot, duration, message, topic } = req.body;

    if (!expertId || !date || !timeSlot || !duration) {
      return res.status(400).json({ message: "Missing booking info" });
    }

    const expert = await prisma.user.findUnique({
      where: { id: expertId },
      include: {
        profile: {
          include: { weeklyAvailability: true },
        },
      },
    });

    if (!expert || expert.role !== "EXPERT") {
      return res.status(404).json({ message: "Expert not found" });
    }

    if (!expert.profile?.hourlyRate) {
      return res.status(400).json({ message: "Expert has no hourly rate set" });
    }

    // Build start datetime
    const bookingDate = new Date(date);
    const [hour, minute] = timeSlot.split(":").map(Number);

    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(hour, minute, 0, 0);

    if (startDateTime < new Date()) {
      return res.status(400).json({
        message: "Cannot book past time",
      });
    }

    // Build end datetime
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);

    // Check weekly availability
    const day = startDateTime.getDay();

    const availability = expert.profile.weeklyAvailability.find(
      (slot) => slot.day === day && slot.enabled,
    );

    if (!availability || !availability.startTime || !availability.endTime) {
      return res.status(400).json({
        message: "Expert not available this day",
      });
    }

    const [startHour, startMinute] = availability.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    const availableStart = new Date(startDateTime);
    availableStart.setHours(startHour, startMinute, 0, 0);

    const availableEnd = new Date(startDateTime);
    availableEnd.setHours(endHour, endMinute, 0, 0);

    if (startDateTime < availableStart || endDateTime > availableEnd) {
      return res.status(400).json({
        message: "Booking exceeds expert availability window",
      });
    }

    // Check overlap (PROFESSIONAL WAY)
    const overlapping = await prisma.booking.findFirst({
      where: {
        expertId,
        status: { in: ["PENDING", "ACCEPTED"] },
        AND: [
          { startDateTime: { lt: endDateTime } },
          { endDateTime: { gt: startDateTime } },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        message: "Time overlaps with another booking",
      });
    }

    // Calculate price
    const price = (Number(expert.profile.hourlyRate) * duration) / 60;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        expertId,
        memberId,
        startDateTime,
        endDateTime,
        duration,
        price,
        message,
        topic,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};
export const getExpertBookings = async (req, res, next) => {
  try {
    const { expertId } = req.params;

    const bookings = await prisma.booking.findMany({
      where: {
        expertId,
        status: { in: ["PENDING", "ACCEPTED"] },
        startDateTime: {
          gte: new Date(),
        },
      },
      include: {
        member: true,
      },
      orderBy: {
        startDateTime: "asc",
      },
    });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};
export const acceptBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.expertId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "ACCEPTED" },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const rejectBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.expertId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || null,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
