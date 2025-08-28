-- CreateTable
CREATE TABLE `SignedTimesheet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `semester` ENUM('S1', 'S2') NOT NULL,
    `originalPdfPath` VARCHAR(191) NOT NULL,
    `signedPdfData` LONGBLOB NOT NULL,
    `signatureDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signatureStatus` ENUM('PENDING', 'SIGNED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `signatureToken` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SignedTimesheet_signatureToken_key`(`signatureToken`),
    INDEX `SignedTimesheet_userId_idx`(`userId`),
    INDEX `SignedTimesheet_signatureToken_idx`(`signatureToken`),
    UNIQUE INDEX `SignedTimesheet_userId_year_semester_key`(`userId`, `year`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SignedTimesheet` ADD CONSTRAINT `SignedTimesheet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
