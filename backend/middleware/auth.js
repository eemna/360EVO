import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export const protect = async (req, res, next) => {
  try {
    console.log(" Incoming request to protected route");
    console.log("Authorization header:", req.headers.authorization);

    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("Extracted token:", token);

    if (!token) {
      console.log(" No token found");
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    console.log("Found user:", user);
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
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};
