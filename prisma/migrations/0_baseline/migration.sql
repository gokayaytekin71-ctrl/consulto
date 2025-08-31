-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dava_turu" TEXT,
    "olay_ozet" TEXT,
    "talep" TEXT,
    "dilekce_md" TEXT NOT NULL,
    "kaynaklar" JSONB,
    "girdi_ozeti" JSONB,
    "dayanaklar" JSONB,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteKarar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kararId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteKarar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteMakale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "makaleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteMakale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteMevzuat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mevzuatKey" TEXT NOT NULL,
    "maddeNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteMevzuat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hearing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karar" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT,
    "code" TEXT,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentLength" INTEGER,
    "keywords" TEXT,
    "tsv_main" tsvector,
    "tsv_extra" tsvector,

    CONSTRAINT "Karar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Makale" (
    "id" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "doi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Makale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mevzuat" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mevzuat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folderId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "chats" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "gundem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,

    CONSTRAINT "gundem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider" ASC, "providerAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteKarar_userId_kararId_key" ON "FavoriteKarar"("userId" ASC, "kararId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteMakale_userId_makaleId_key" ON "FavoriteMakale"("userId" ASC, "makaleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteMevzuat_userId_mevzuatKey_maddeNo_key" ON "FavoriteMevzuat"("userId" ASC, "mevzuatKey" ASC, "maddeNo" ASC);

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId" ASC);

-- CreateIndex
CREATE INDEX "Hearing_date_idx" ON "Hearing"("date" ASC);

-- CreateIndex
CREATE INDEX "Hearing_userId_idx" ON "Hearing"("userId" ASC);

-- CreateIndex
CREATE INDEX "Karar_contentLength_idx" ON "Karar"("contentLength" ASC);

-- CreateIndex
CREATE INDEX "Karar_createdAt_id_desc_idx" ON "Karar"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Karar_fileName_key" ON "Karar"("fileName" ASC);

-- CreateIndex
CREATE INDEX "Karar_keywords_idx" ON "Karar"("keywords" ASC);

-- CreateIndex
CREATE INDEX "idx_karar_tsv_extra" ON "Karar" USING GIN ("tsv_extra" tsvector_ops ASC);

-- CreateIndex
CREATE INDEX "karar_code_trgm" ON "Karar" USING GIN ("code" gin_trgm_ops ASC);

-- CreateIndex
CREATE INDEX "karar_keywords_trgm" ON "Karar" USING GIN ("keywords" gin_trgm_ops ASC);

-- CreateIndex
CREATE INDEX "karar_type_trgm" ON "Karar" USING GIN ("type" gin_trgm_ops ASC);

-- CreateIndex
CREATE INDEX "karartsv_extra_gin" ON "Karar" USING GIN ("tsv_extra" tsvector_ops ASC);

-- CreateIndex
CREATE INDEX "karartsv_main_gin" ON "Karar" USING GIN ("tsv_main" tsvector_ops ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Makale_doi_key" ON "Makale"("doi" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Mevzuat_key_key" ON "Mevzuat"("key" ASC);

-- CreateIndex
CREATE INDEX "Note_folderId_idx" ON "Note"("folderId" ASC);

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken" ASC);

-- CreateIndex
CREATE INDEX "Task_date_idx" ON "Task"("date" ASC);

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier" ASC, "token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token" ASC);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteKarar" ADD CONSTRAINT "FavoriteKarar_kararId_fkey" FOREIGN KEY ("kararId") REFERENCES "Karar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteKarar" ADD CONSTRAINT "FavoriteKarar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMakale" ADD CONSTRAINT "FavoriteMakale_makaleId_fkey" FOREIGN KEY ("makaleId") REFERENCES "Makale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMakale" ADD CONSTRAINT "FavoriteMakale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMevzuat" ADD CONSTRAINT "FavoriteMevzuat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hearing" ADD CONSTRAINT "Hearing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

