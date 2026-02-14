import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from "cors";
import authRoutes from "./routes/auth.js";
import errorHandler from "./middleware/errorMiddleware.js";
import { initDB } from "./config/db.js";
import rateLimiter from './middleware/rateLimiter.js';


dotenv.config();
const app = express();

app.use(rateLimiter);


app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.use("/api/auth", authRoutes);


const PORT= process.env.PORT || 5001;

app.use(errorHandler);


initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });
}); 