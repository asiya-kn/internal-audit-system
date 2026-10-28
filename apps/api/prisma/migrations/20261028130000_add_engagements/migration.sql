-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('INTERNAL_AUDIT', 'COMPLIANCE_AUDIT', 'IT_AUDIT', 'OPERATIONAL_AUDIT', 'FINANCIAL_AUDIT', 'FOLLOW_UP', 'SPECIAL_REVIEW', 'AD_HOC');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('LEAD_AUDITOR', 'AUDITOR', 'OBSERVER', 'SUBJECT_MATTER_EXPERT', 'REVIEWER');

-- CreateTable
CREATE TABLE "Engagement" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "auditPlanId" UUID,
    "auditEntityId" UUID NOT NULL,
    "riskId" UUID,
    "type" "EngagementType" NOT NULL DEFAULT 'INTERNAL_AUDIT',
    "status" "EngagementStatus" NOT NULL DEFAULT 'PLANNED',
    "objectives" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "methodology" TEXT,
    "leadAuditorId" UUID,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedById" UUID,
    "closureNotes" TEXT,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementTeamMember" (
    "engagementId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'AUDITOR',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementTeamMember_pkey" PRIMARY KEY ("engagementId", "userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_reference_key" ON "Engagement"("reference");
CREATE INDEX "Engagement_auditPlanId_idx" ON "Engagement"("auditPlanId");
CREATE INDEX "Engagement_auditEntityId_idx" ON "Engagement"("auditEntityId");
CREATE INDEX "Engagement_riskId_idx" ON "Engagement"("riskId");
CREATE INDEX "Engagement_status_idx" ON "Engagement"("status");
CREATE INDEX "Engagement_type_idx" ON "Engagement"("type");
CREATE INDEX "Engagement_leadAuditorId_idx" ON "Engagement"("leadAuditorId");
CREATE INDEX "Engagement_title_idx" ON "Engagement"("title");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementTeamMember_engagementId_userId_key" ON "EngagementTeamMember"("engagementId", "userId");
CREATE INDEX "EngagementTeamMember_userId_idx" ON "EngagementTeamMember"("userId");

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_auditPlanId_fkey" FOREIGN KEY ("auditPlanId") REFERENCES "AuditPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_auditEntityId_fkey" FOREIGN KEY ("auditEntityId") REFERENCES "AuditUniverse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_leadAuditorId_fkey" FOREIGN KEY ("leadAuditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EngagementTeamMember" ADD CONSTRAINT "EngagementTeamMember_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementTeamMember" ADD CONSTRAINT "EngagementTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
