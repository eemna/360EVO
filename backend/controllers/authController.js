import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken } 
from "../utils/tokenUtils.js";
import { sendEmail } from "../utils/email.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import jwt from "jsonwebtoken";


dotenv.config();


  // REGISTER



export const register = async (req, res, next) => {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          email,
          password_hash: hashedPassword,
          role,
          name,
        },
      });

      if (role === "startup") {
        if (!companyName) {
          throw new Error("Company name is required for startups");
        }

        await tx.startup_profiles.create({
          data: {
            user_id: createdUser.id,
            company_name: companyName,
            stage: stage || null,
          },
        });
      }

      if (role === "expert") {
        if (!expertise) {
          throw new Error("Expertise is required for experts");
        }

        await tx.tx.expert_profiles.create({
          data: {
            user_id: createdUser.id,
            expertise,
            hourly_rate: hourlyRate || null,
          },
        });
      }

      await tx.email_verifications.deleteMany({
        where: { user_id: createdUser.id },
      });

      await tx.email_verifications.create({
        data: {
          user_id: createdUser.id,
          token: verificationToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return createdUser;
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

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
      user: newUser,
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

  const userData = await prisma.users.findUnique({
  where: { email },
});

if (!userData) {
  return res.status(400).json({ message: "Invalid credentials" });
}

    

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
await prisma.sessions.create({
  data: {
    user_id: userData.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    device_info: req.headers["user-agent"],
  },
});


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

  const verification = await prisma.email_verifications.findFirst({
  where: {
    token,
    expires_at: { gt: new Date() },
  },
});

if (!verification) {
  return res.status(400).json({ message: "Invalid or expired token" });
}

    

  await prisma.users.update({
  where: { id: verification.user_id },
  data: { is_verified: true },
});

await prisma.email_verifications.delete({
  where: { id: verification.id },
});

    res.json({ message: "Email verified successfully" });

  }catch (error) {
  next(error);
}
};



 //  FORGOT PASSWORD

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

const user = await prisma.users.findUnique({
  where: { email },
});

if (!user) {
  return res.json({ message: "If this email exists, a reset link has been sent" });
}

    const resetToken = crypto.randomBytes(32).toString("hex");
await prisma.password_resets.deleteMany({
  where: { user_id: user.id },
});

await prisma.password_resets.create({
  data: {
    user_id: user.id,
    token: resetToken,
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
  },
});
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

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    await prisma.email_verifications.deleteMany({
      where: { user_id: user.id },
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.email_verifications.create({
      data: {
        user_id: user.id,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // Check if refresh token exists in DB
   const session = await prisma.sessions.findFirst({
  where: {
    token: refreshToken,
    expires_at: { gt: new Date() },
  },
});


   if (!session) {
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

    const resetRecord = await prisma.password_resets.findFirst({
  where: {
    token,
    expires_at: { gt: new Date() },
  },
});

if (!resetRecord) {
  return res.status(400).json({
    message: "Invalid or expired token",
  });
}

   

    const hashedPassword = await bcrypt.hash(newPassword, 10);
await prisma.users.update({
  where: { id: resetRecord.user_id },
  data: { password_hash: hashedPassword },
});

await prisma.password_resets.deleteMany({
  where: { user_id: resetRecord.user_id },
});

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
     await prisma.sessions.deleteMany({
  where: { token: refreshToken },
});

    }

    res.cookie("refreshToken", "", { ...cookieOptions, maxAge: 1 });

    res.json({ message: "Logged out successfully" });

  } catch (error) {
    next(error);
  }
};


