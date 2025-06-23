/*
  Warnings:

  - A unique constraint covering the columns `[doi]` on the table `Makale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Makale_doi_key" ON "Makale"("doi");
