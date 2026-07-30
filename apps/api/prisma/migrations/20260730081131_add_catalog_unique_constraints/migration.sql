/*
  Warnings:

  - The values [DIGITALS] on the enum `ProductCondition` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[city_id,name]` on the table `campuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `cities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[category_id,name]` on the table `subcategories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductCondition_new" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'DIGITAL');
ALTER TABLE "products" ALTER COLUMN "condition" TYPE "ProductCondition_new" USING ("condition"::text::"ProductCondition_new");
ALTER TYPE "ProductCondition" RENAME TO "ProductCondition_old";
ALTER TYPE "ProductCondition_new" RENAME TO "ProductCondition";
DROP TYPE "public"."ProductCondition_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "campuses_city_id_name_key" ON "campuses"("city_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_category_id_name_key" ON "subcategories"("category_id", "name");
