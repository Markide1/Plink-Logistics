/*
  Warnings:

  - Added the required column `receiverName` to the `parcel_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "parcel_requests" ADD COLUMN     "receiverName" TEXT NOT NULL,
ADD COLUMN     "receiverPhone" TEXT;
