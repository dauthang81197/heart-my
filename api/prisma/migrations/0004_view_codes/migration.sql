-- CreateTable
CREATE TABLE "ViewCode" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewCode_letterId_idx" ON "ViewCode"("letterId");

-- AddForeignKey
ALTER TABLE "ViewCode" ADD CONSTRAINT "ViewCode_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "Letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
