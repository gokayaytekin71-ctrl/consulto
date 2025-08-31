-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chats" JSONB NOT NULL DEFAULT '[]';
