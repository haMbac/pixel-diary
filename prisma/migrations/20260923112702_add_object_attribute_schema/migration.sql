-- AlterEnum
BEGIN;
CREATE TYPE "AttributeType_new" AS ENUM ('TEXT', 'NUMBER', 'RATING');
ALTER TABLE "Attribute" ALTER COLUMN "type" TYPE "AttributeType_new" USING ("type"::text::"AttributeType_new");
ALTER TYPE "AttributeType" RENAME TO "AttributeType_old";
ALTER TYPE "AttributeType_new" RENAME TO "AttributeType";
DROP TYPE "AttributeType_old";
COMMIT;

-- AlterTable
ALTER TABLE "ObjCategory" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Attribute" ADD COLUMN     "ratingScale" INTEGER,
ADD COLUMN     "templateId" TEXT NOT NULL;

-- DropIndex
DROP INDEX "Attribute_objektId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_objektId_templateId_key" ON "Attribute"("objektId", "templateId");
