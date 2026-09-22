-- CreateTable "Wallet"
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CASH',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "icon" TEXT DEFAULT 'wallet',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "Wallet_householdId_idx" ON "Wallet"("householdId");

-- AddColumn walletId to Expense
ALTER TABLE "Expense" ADD COLUMN "walletId" TEXT;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL;
CREATE INDEX "Expense_walletId_idx" ON "Expense"("walletId");

-- AddColumn walletId to Income
ALTER TABLE "Income" ADD COLUMN "walletId" TEXT;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL;
CREATE INDEX "Income_walletId_idx" ON "Income"("walletId");
