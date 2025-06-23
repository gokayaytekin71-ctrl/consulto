-- AlterTable
ALTER TABLE "Karar" ADD COLUMN     "contentLength" INTEGER;

-- CreateIndex
CREATE INDEX "Karar_contentLength_idx" ON "Karar"("contentLength");
