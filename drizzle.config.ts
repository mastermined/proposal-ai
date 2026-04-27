import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// drizzle-kit reads .env by default, not .env.local — load it explicitly
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set.\n" +
    "Make sure you have a .env.local file with:\n" +
    "  DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require"
  );
}

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
