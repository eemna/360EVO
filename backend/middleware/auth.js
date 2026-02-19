import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isSuspended: true,
      },
    });
     if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!user.isVerified) {
    return res.status(403).json({ message: "Email not verified" });
    }

    if (user.isSuspended) {
    return res.status(403).json({ message: "Account suspended" });
    }

   

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Make sure protect ran first
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};
