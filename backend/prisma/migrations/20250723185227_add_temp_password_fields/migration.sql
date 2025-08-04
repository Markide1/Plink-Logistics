-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tempPassword" TEXT,
ADD COLUMN     "tempPasswordExpiry" TIMESTAMP(3);
