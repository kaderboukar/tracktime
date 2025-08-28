/*
  Warnings:

  - You are about to alter the column `semester` on the `TimePeriod` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Enum(EnumId(4))`.
  - A unique constraint covering the columns `[year,semester]` on the table `TimePeriod` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `TimePeriod` MODIFY `semester` ENUM('S1', 'S2') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TimePeriod_year_semester_key` ON `TimePeriod`(`year`, `semester`);
