/*
  Warnings:

  - You are about to drop the column `firstName` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[indice]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `grade` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indice` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proformaCost` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `firstName`,
    DROP COLUMN `lastName`,
    ADD COLUMN `grade` VARCHAR(191) NOT NULL,
    ADD COLUMN `indice` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `proformaCost` DOUBLE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_indice_key` ON `User`(`indice`);
