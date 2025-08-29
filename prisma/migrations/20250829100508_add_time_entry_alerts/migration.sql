-- CreateTable
CREATE TABLE `TimeEntryAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `timePeriodId` INTEGER NOT NULL,
    `alertType` ENUM('FIRST_REMINDER', 'SECOND_REMINDER', 'THIRD_REMINDER', 'FINAL_REMINDER') NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `daysSinceActivation` INTEGER NOT NULL,
    `emailSent` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TimeEntryAlert_userId_idx`(`userId`),
    INDEX `TimeEntryAlert_timePeriodId_idx`(`timePeriodId`),
    INDEX `TimeEntryAlert_alertType_idx`(`alertType`),
    INDEX `TimeEntryAlert_sentAt_idx`(`sentAt`),
    UNIQUE INDEX `TimeEntryAlert_userId_timePeriodId_alertType_key`(`userId`, `timePeriodId`, `alertType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TimeEntryAlert` ADD CONSTRAINT `TimeEntryAlert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntryAlert` ADD CONSTRAINT `TimeEntryAlert_timePeriodId_fkey` FOREIGN KEY (`timePeriodId`) REFERENCES `TimePeriod`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
