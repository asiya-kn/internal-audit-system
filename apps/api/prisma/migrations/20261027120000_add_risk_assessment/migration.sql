-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATING', 'MONITORING', 'CLOSED');
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

CREATE TABLE "Risk" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "auditEntityId" UUID NOT NULL,
    "inherentLikelihood" INTEGER NOT NULL DEFAULT 1,
    "inherentImpact" INTEGER NOT NULL DEFAULT 1,
    "inherentScore" INTEGER NOT NULL DEFAULT 1,
    "inherentLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "existingControls" TEXT,
    "controlEffectiveness" INTEGER NOT NULL DEFAULT 0,
    "residualScore" INTEGER NOT NULL DEFAULT 1,
    "residualLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "riskCategory" TEXT,
    "notes" TEXT,
    "ownerId" UUID,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiskAction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "riskId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" UUID,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RiskAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Risk_auditEntityId_idx" ON "Risk"("auditEntityId");
CREATE INDEX "Risk_status_idx" ON "Risk"("status");
CREATE INDEX "Risk_inherentLevel_idx" ON "Risk"("inherentLevel");
CREATE INDEX "Risk_residualLevel_idx" ON "Risk"("residualLevel");
CREATE INDEX "Risk_ownerId_idx" ON "Risk"("ownerId");
CREATE INDEX "Risk_title_idx" ON "Risk"("title");
CREATE INDEX "RiskAction_riskId_idx" ON "RiskAction"("riskId");
CREATE INDEX "RiskAction_status_idx" ON "RiskAction"("status");
CREATE INDEX "RiskAction_dueDate_idx" ON "RiskAction"("dueDate");
CREATE INDEX "RiskAction_assigneeId_idx" ON "RiskAction"("assigneeId");

ALTER TABLE "Risk" ADD CONSTRAINT "Risk_auditEntityId_fkey" FOREIGN KEY ("auditEntityId") REFERENCES "AuditUniverse"("id") ON DELETE CASCADE;
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "RiskAction" ADD CONSTRAINT "RiskAction_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE;
ALTER TABLE "RiskAction" ADD CONSTRAINT "RiskAction_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL;
