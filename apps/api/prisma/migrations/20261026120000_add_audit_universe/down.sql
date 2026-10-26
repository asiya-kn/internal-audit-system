-- DropIndex
DROP INDEX "AuditUniverse_ownerId_idx";

-- DropIndex
DROP INDEX "AuditUniverse_name_idx";

-- DropIndex
DROP INDEX "AuditUniverse_status_idx";

-- DropIndex
DROP INDEX "AuditUniverse_entityType_idx";

-- DropIndex
DROP INDEX "AuditUniverse_parentId_idx";

-- DropForeignKey
ALTER TABLE "AuditUniverse" DROP CONSTRAINT "AuditUniverse_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "AuditUniverse" DROP CONSTRAINT "AuditUniverse_createdById_fkey";

-- DropForeignKey
ALTER TABLE "AuditUniverse" DROP CONSTRAINT "AuditUniverse_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "AuditUniverse" DROP CONSTRAINT "AuditUniverse_parentId_fkey";

-- DropTable
DROP TABLE "AuditUniverse";

-- DropEnum
DROP TYPE "AuditEntityStatus";

-- DropEnum
DROP TYPE "AuditEntityType";
