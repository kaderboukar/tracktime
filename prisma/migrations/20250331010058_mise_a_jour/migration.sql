/*
  Warnings:

  - You are about to drop the column `endDate` on the `timeentry` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `timeentry` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentType` on the `userproject` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `userproject` table. All the data in the column will be lost.
  - Added the required column `semester` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `allocationPercentage` to the `UserProject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserProject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `timeentry` DROP COLUMN `endDate`,
    DROP COLUMN `startDate`,
    ADD COLUMN `semester` ENUM('S1', 'S2') NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `type` ENUM('OPERATION', 'PROGRAMME', 'SUPPORT') NOT NULL DEFAULT 'OPERATION';

-- AlterTable
ALTER TABLE `userproject` DROP COLUMN `assignmentType`,
    DROP COLUMN `percentage`,
    ADD COLUMN `allocationPercentage` DOUBLE NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
