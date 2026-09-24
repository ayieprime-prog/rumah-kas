-- AlterTable
ALTER TABLE "Income" ADD COLUMN "lockedCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "Income_lockedCategoryId_idx" ON "Income"("lockedCategoryId");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_lockedCategoryId_fkey" FOREIGN KEY ("lockedCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
