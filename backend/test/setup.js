import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 50));
const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.test"), override: true });
