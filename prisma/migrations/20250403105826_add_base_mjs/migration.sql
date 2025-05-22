/*
  Warnings:

  - You are about to drop the column `proformaCost` on the `user` table. All the data in the column will be lost.
  - Added the required column `signature` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `timeentry` ADD COLUMN `comment` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `validatedAt` DATETIME(3) NULL,
    ADD COLUMN `validatedBy` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `proformaCost`,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `signature` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `TimeEntryValidation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timeEntryId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISED') NOT NULL,
    `comment` VARCHAR(191) NULL,
    `validatedBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TimeEntryValidation_timeEntryId_idx`(`timeEntryId`),
    INDEX `TimeEntryValidation_validatedBy_idx`(`validatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProformaCost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `cost` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserProformaCost_userId_idx`(`userId`),
    UNIQUE INDEX `UserProformaCost_userId_year_key`(`userId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `TimeEntry_validatedBy_idx` ON `TimeEntry`(`validatedBy`);

-- AddForeignKey
ALTER TABLE `TimeEntry` ADD CONSTRAINT `TimeEntry_validatedBy_fkey` FOREIGN KEY (`validatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntryValidation` ADD CONSTRAINT `TimeEntryValidation_timeEntryId_fkey` FOREIGN KEY (`timeEntryId`) REFERENCES `TimeEntry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntryValidation` ADD CONSTRAINT `TimeEntryValidation_validatedBy_fkey` FOREIGN KEY (`validatedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProformaCost` ADD CONSTRAINT `UserProformaCost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
