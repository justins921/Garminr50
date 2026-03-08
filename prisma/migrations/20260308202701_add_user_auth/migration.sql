/*
  Warnings:

  - Added the required column `userId` to the `BagMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `DeviceConnection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ImportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WedgeMatrix` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BagMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Bag',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minShots" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BagMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BagMapping" ("createdAt", "id", "isActive", "minShots", "name", "updatedAt") SELECT "createdAt", "id", "isActive", "minShots", "name", "updatedAt" FROM "BagMapping";
DROP TABLE "BagMapping";
ALTER TABLE "new_BagMapping" RENAME TO "BagMapping";
CREATE INDEX "BagMapping_userId_idx" ON "BagMapping"("userId");
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "loft" REAL,
    "brand" TEXT,
    "model" TEXT,
    "shaft" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Club_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Club" ("brand", "createdAt", "id", "isActive", "loft", "model", "name", "shaft", "sortOrder", "type", "updatedAt") SELECT "brand", "createdAt", "id", "isActive", "loft", "model", "name", "shaft", "sortOrder", "type", "updatedAt" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE INDEX "Club_userId_idx" ON "Club"("userId");
CREATE TABLE "new_DeviceConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL DEFAULT 'Garmin Approach R50',
    "deviceType" TEXT NOT NULL DEFAULT 'r50',
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "lastSeen" DATETIME,
    "ipAddress" TEXT,
    "port" INTEGER,
    "protocol" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeviceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeviceConnection" ("createdAt", "deviceName", "deviceType", "id", "ipAddress", "lastSeen", "metadata", "port", "protocol", "status", "updatedAt") SELECT "createdAt", "deviceName", "deviceType", "id", "ipAddress", "lastSeen", "metadata", "port", "protocol", "status", "updatedAt" FROM "DeviceConnection";
DROP TABLE "DeviceConnection";
ALTER TABLE "new_DeviceConnection" RENAME TO "DeviceConnection";
CREATE INDEX "DeviceConnection_userId_idx" ON "DeviceConnection"("userId");
CREATE TABLE "new_ImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "filename" TEXT,
    "status" TEXT NOT NULL,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ImportLog" ("createdAt", "errors", "filename", "id", "shotCount", "source", "status", "updatedAt") SELECT "createdAt", "errors", "filename", "id", "shotCount", "source", "status", "updatedAt" FROM "ImportLog";
DROP TABLE "ImportLog";
ALTER TABLE "new_ImportLog" RENAME TO "ImportLog";
CREATE INDEX "ImportLog_userId_idx" ON "ImportLog"("userId");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "location" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'indoor',
    "sessionType" TEXT NOT NULL DEFAULT 'practice',
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("createdAt", "endedAt", "environment", "id", "isLive", "isPaused", "location", "name", "notes", "sessionType", "source", "startedAt", "updatedAt") SELECT "createdAt", "endedAt", "environment", "id", "isLive", "isPaused", "location", "name", "notes", "sessionType", "source", "startedAt", "updatedAt" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("color", "createdAt", "id", "name") SELECT "color", "createdAt", "id", "name" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");
CREATE TABLE "new_WedgeMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Wedge Matrix',
    "system" TEXT NOT NULL DEFAULT 'clock',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WedgeMatrix_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WedgeMatrix" ("createdAt", "id", "isActive", "name", "system", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "system", "updatedAt" FROM "WedgeMatrix";
DROP TABLE "WedgeMatrix";
ALTER TABLE "new_WedgeMatrix" RENAME TO "WedgeMatrix";
CREATE INDEX "WedgeMatrix_userId_idx" ON "WedgeMatrix"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
