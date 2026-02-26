/*
  Warnings:

  - You are about to drop the column `supplierId` on the `product_variants` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "ProductStatus" ADD VALUE 'APPROVED';

-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_supplierId_fkey";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "supplierId",
ADD COLUMN     "supplier" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "merchantWebProductId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
