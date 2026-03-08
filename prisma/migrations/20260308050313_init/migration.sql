-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "loft" REAL,
    "brand" TEXT,
    "model" TEXT,
    "shaft" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "clubId" TEXT,
    "shotNumber" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ballSpeed" REAL,
    "launchAngle" REAL,
    "launchDirection" REAL,
    "spinRate" REAL,
    "backSpin" REAL,
    "sideSpin" REAL,
    "spinAxis" REAL,
    "carryDistance" REAL,
    "totalDistance" REAL,
    "offlineDistance" REAL,
    "apexHeight" REAL,
    "clubSpeed" REAL,
    "smashFactor" REAL,
    "angleOfAttack" REAL,
    "clubPath" REAL,
    "faceAngle" REAL,
    "faceToPath" REAL,
    "dynamicLoft" REAL,
    "shotShape" TEXT,
    "shotResult" TEXT,
    "validity" TEXT NOT NULL DEFAULT 'valid',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shot_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SessionTag" (
    "sessionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("sessionId", "tagId"),
    CONSTRAINT "SessionTag_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShotTag" (
    "shotId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("shotId", "tagId"),
    CONSTRAINT "ShotTag_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShotTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "filename" TEXT,
    "status" TEXT NOT NULL,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeviceConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceName" TEXT NOT NULL DEFAULT 'Garmin Approach R50',
    "deviceType" TEXT NOT NULL DEFAULT 'r50',
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "lastSeen" DATETIME,
    "ipAddress" TEXT,
    "port" INTEGER,
    "protocol" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Shot_sessionId_idx" ON "Shot"("sessionId");

-- CreateIndex
CREATE INDEX "Shot_clubId_idx" ON "Shot"("clubId");

-- CreateIndex
CREATE INDEX "Shot_timestamp_idx" ON "Shot"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
