-- AlterTable
ALTER TABLE "Karar" ADD COLUMN     "keywords" TEXT;

-- CreateIndex
CREATE INDEX "Karar_keywords_idx" ON "Karar"("keywords");
