/*
  Warnings:

  - You are about to drop the column `targetType` on the `reports` table. All the data in the column will be lost.
  - Added the required column `target_type` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "reports_targetType_status_created_at_idx";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "targetType",
ADD COLUMN     "target_type" "ReportTargetType" NOT NULL;

-- CreateIndex
CREATE INDEX "reports_target_type_status_created_at_idx" ON "reports"("target_type", "status", "created_at");
