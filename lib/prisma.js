// lib/prisma.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// ÖNEMLİ: Serverless (Vercel) ortamında prod'da da global cache kullan.
// Aksi halde her "warm" lambda yeni bir PrismaClient + yeni bağlantı havuzu açar
// ve pgbouncer'ı (6432) doldurarak "Can't reach database server" hatasına yol açar.
const prisma =
  globalForPrisma.__prisma__ ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

// Dev'de hot-reload'da, prod'da warm-reuse'da tek client'ı koru.
globalForPrisma.__prisma__ = prisma;

export default prisma;