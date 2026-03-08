-- CreateTable
CREATE TABLE "BagMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'My Bag',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minShots" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BagMappingClub" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bagMappingId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "avgCarry" REAL,
    "avgTotal" REAL,
    "minCarry" REAL,
    "maxCarry" REAL,
    "avgOffline" REAL,
    "dispersionRadius" REAL,
    "dispersionAngle" REAL,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BagMappingClub_bagMappingId_fkey" FOREIGN KEY ("bagMappingId") REFERENCES "BagMapping" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WedgeMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'My Wedge Matrix',
    "system" TEXT NOT NULL DEFAULT 'clock',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WedgeMatrixEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wedgeMatrixId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "swingKey" TEXT NOT NULL,
    "swingLabel" TEXT NOT NULL,
    "targetDistance" REAL,
    "avgCarry" REAL,
    "avgTotal" REAL,
    "avgSpinRate" REAL,
    "avgLaunchAngle" REAL,
    "minCarry" REAL,
    "maxCarry" REAL,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WedgeMatrixEntry_wedgeMatrixId_fkey" FOREIGN KEY ("wedgeMatrixId") REFERENCES "WedgeMatrix" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BagMappingClub_bagMappingId_idx" ON "BagMappingClub"("bagMappingId");

-- CreateIndex
CREATE INDEX "BagMappingClub_clubId_idx" ON "BagMappingClub"("clubId");

-- CreateIndex
CREATE INDEX "WedgeMatrixEntry_wedgeMatrixId_idx" ON "WedgeMatrixEntry"("wedgeMatrixId");

-- CreateIndex
CREATE INDEX "WedgeMatrixEntry_clubId_idx" ON "WedgeMatrixEntry"("clubId");
