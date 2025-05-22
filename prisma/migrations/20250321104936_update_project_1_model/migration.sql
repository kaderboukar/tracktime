/*
  Warnings:

  - You are about to alter the column `staffAccess` on the `project` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `project` MODIFY `staffAccess` VARCHAR(191) NOT NULL;
