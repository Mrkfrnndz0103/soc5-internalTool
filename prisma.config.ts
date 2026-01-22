import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config(); // loads .env into process.env

export default defineConfig({
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
