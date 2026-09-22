-- CreateTable
CREATE TABLE "ImportantLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportantLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportantLink_householdId_idx" ON "ImportantLink"("householdId");

-- AddForeignKey
ALTER TABLE "ImportantLink" ADD CONSTRAINT "ImportantLink_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

