-- CreateEnum
CREATE TYPE "AuditPlanStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "AuditPlan" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "auditEntityId" UUID NOT NULL,
    "riskId" UUID,
    "objectives" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "priority" "AuditPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AuditPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "proposedStartDate" TIMESTAMP(3),
    "proposedEndDate" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "leadAuditorId" UUID,
    "notes" TEXT,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditPlan_reference_key" ON "AuditPlan"("reference");
CREATE INDEX "AuditPlan_auditEntityId_idx" ON "AuditPlan"("auditEntityId");
CREATE INDEX "AuditPlan_riskId_idx" ON "AuditPlan"("riskId");
CREATE INDEX "AuditPlan_status_idx" ON "AuditPlan"("status");
CREATE INDEX "AuditPlan_priority_idx" ON "AuditPlan"("priority");
CREATE INDEX "AuditPlan_fiscalYear_idx" ON "AuditPlan"("fiscalYear");
CREATE INDEX "AuditPlan_leadAuditorId_idx" ON "AuditPlan"("leadAuditorId");
CREATE INDEX "AuditPlan_title_idx" ON "AuditPlan"("title");

-- AddForeignKey
ALTER TABLE "AuditPlan" ADD CONSTRAINT "AuditPlan_auditEntityId_fkey" FOREIGN KEY ("auditEntityId") REFERENCES "AuditUniverse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditPlan" ADD CONSTRAINT "AuditPlan_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditPlan" ADD CONSTRAINT "AuditPlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditPlan" ADD CONSTRAINT "AuditPlan_leadAuditorId_fkey" FOREIGN KEY ("leadAuditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditPlan" ADD CONSTRAINT "AuditPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditPlan" ADD CONSTRAINT "AuditPlan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
