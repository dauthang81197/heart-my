-- Email chỉ được coi là đã xác minh khi đăng nhập bằng Google.
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerified" = true WHERE "googleId" IS NOT NULL;
