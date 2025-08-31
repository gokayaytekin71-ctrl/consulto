-- CreateTable
CREATE TABLE "Makale" (
    "id" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "doi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Makale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteMakale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "makaleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteMakale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteMakale_userId_makaleId_key" ON "FavoriteMakale"("userId", "makaleId");

-- AddForeignKey
ALTER TABLE "FavoriteMakale" ADD CONSTRAINT "FavoriteMakale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMakale" ADD CONSTRAINT "FavoriteMakale_makaleId_fkey" FOREIGN KEY ("makaleId") REFERENCES "Makale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
