/*
  Warnings:

  - The values [RECEIVED] on the enum `ParcelStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParcelStatus_new" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
ALTER TABLE "parcels" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "parcels" ALTER COLUMN "status" TYPE "ParcelStatus_new" USING ("status"::text::"ParcelStatus_new");
ALTER TYPE "ParcelStatus" RENAME TO "ParcelStatus_old";
ALTER TYPE "ParcelStatus_new" RENAME TO "ParcelStatus";
DROP TYPE "ParcelStatus_old";
ALTER TABLE "parcels" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
