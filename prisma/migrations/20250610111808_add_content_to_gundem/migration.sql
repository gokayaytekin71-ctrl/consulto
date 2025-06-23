/*
  Warnings:

  - Added the required column `content` to the `gundem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gundem" ADD COLUMN "content" TEXT NOT NULL DEFAULT '';
