/*
  Warnings:

  - You are about to drop the column `description` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectNumber]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectNumber` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectType` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `project` DROP COLUMN `description`,
    DROP COLUMN `endDate`,
    DROP COLUMN `startDate`,
    ADD COLUMN `projectNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `projectType` VARCHAR(191) NOT NULL,
    ADD COLUMN `staffAccess` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `Project_projectNumber_key` ON `Project`(`projectNumber`);
