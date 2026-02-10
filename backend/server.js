import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from "cors";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5174",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

const PORT= process.env.PORT || 5001;


app.listen(PORT, () => {
    console.log("Server is running on port ${PORT}")
})