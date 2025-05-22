/*
  Warnings:

  - You are about to alter the column `staffAccess` on the `project` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `project` MODIFY `staffAccess` ENUM('ALL', 'OPERATION', 'PROGRAMME', 'SUPPORT') NOT NULL DEFAULT 'ALL';
