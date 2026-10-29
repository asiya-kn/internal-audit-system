-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('INTERNAL_CONTROL', 'COMPLIANCE', 'OPERATIONAL', 'FINANCIAL', 'IT_GENERAL_CONTROLS', 'DATA_QUALITY', 'GOVERNANCE', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('DRAFT', 'OPEN', 'MANAGEMENT_RESPONSE', 'ACTION_PLAN', 'REMEDIATED', 'VERIFIED', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Finding" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "engagementId" UUID,
    "auditEntityId" UUID NOT NULL,
    "category" "FindingCategory" NOT NULL DEFAULT 'OTHER',
    "severity" "FindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "FindingStatus" NOT NULL DEFAULT 'DRAFT',
    "condition" TEXT NOT NULL,
    "criteria" TEXT,
    "cause" TEXT,
    "impact" TEXT,
    "recommendations" TEXT,
    "managementResponse" TEXT,
    "managementRespondedAt" TIMESTAMP(3),
    "managementRespondedById" UUID,
    "responsibleOwnerId" UUID,
    "targetResolutionDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" UUID,
    "verificationNotes" TEXT,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Finding_reference_key" ON "Finding"("reference");
CREATE INDEX "Finding_engagementId_idx" ON "Finding"("engagementId");
CREATE INDEX "Finding_auditEntityId_idx" ON "Finding"("auditEntityId");
CREATE INDEX "Finding_category_idx" ON "Finding"("category");
CREATE INDEX "Finding_severity_idx" ON "Finding"("severity");
CREATE INDEX "Finding_status_idx" ON "Finding"("status");
CREATE INDEX "Finding_responsibleOwnerId_idx" ON "Finding"("responsibleOwnerId");
CREATE INDEX "Finding_targetResolutionDate_idx" ON "Finding"("targetResolutionDate");
CREATE INDEX "Finding_title_idx" ON "Finding"("title");

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_auditEntityId_fkey" FOREIGN KEY ("auditEntityId") REFERENCES "AuditUniverse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_responsibleOwnerId_fkey" FOREIGN KEY ("responsibleOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_managementRespondedById_fkey" FOREIGN KEY ("managementRespondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
