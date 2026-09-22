-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "changes",
ADD COLUMN     "householdId" TEXT NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_householdId_idx" ON "AuditLog"("householdId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

