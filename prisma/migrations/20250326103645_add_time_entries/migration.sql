-- RenameIndex
ALTER TABLE `timeentry` RENAME INDEX `TimeEntry_activityId_fkey` TO `TimeEntry_activityId_idx`;

-- RenameIndex
ALTER TABLE `timeentry` RENAME INDEX `TimeEntry_projectId_fkey` TO `TimeEntry_projectId_idx`;

-- RenameIndex
ALTER TABLE `timeentry` RENAME INDEX `TimeEntry_userId_fkey` TO `TimeEntry_userId_idx`;
