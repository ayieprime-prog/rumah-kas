-- CreateEnum TransferStatus
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateTable "Transfer"
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "fromWalletId" TEXT NOT NULL,
    "toWalletId" TEXT NOT NULL,
    "initiatedById" TEXT,
    "recipientId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transfer_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE,
    CONSTRAINT "Transfer_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE,
    CONSTRAINT "Transfer_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "Transfer_householdId_idx" ON "Transfer"("householdId");
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");
CREATE INDEX "Transfer_fromWalletId_idx" ON "Transfer"("fromWalletId");
CREATE INDEX "Transfer_toWalletId_idx" ON "Transfer"("toWalletId");
