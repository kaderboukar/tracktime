-- AlterTable
ALTER TABLE `SignedTimesheet` MODIFY `signedPdfData` LONGBLOB NULL,
    MODIFY `signatureDate` DATETIME(3) NULL;
