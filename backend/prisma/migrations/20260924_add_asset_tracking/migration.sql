-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('REAL_ESTATE', 'VEHICLE', 'JEWELRY', 'ART', 'CRYPTOCURRENCY', 'CASH_ALTERNATIVE', 'OTHER');

-- CreateTable "Asset"
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "description" TEXT,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "location" TEXT,
    "notes" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "Asset_householdId_idx" ON "Asset"("householdId");
CREATE INDEX "Asset_type_idx" ON "Asset"("type");

-- CreateTable "AssetValuation"
CREATE TABLE "AssetValuation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetValuation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "AssetValuation_assetId_idx" ON "AssetValuation"("assetId");
CREATE INDEX "AssetValuation_date_idx" ON "AssetValuation"("date");
