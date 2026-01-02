-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `mobile` VARCHAR(15) NOT NULL,
    `address` TEXT NULL,
    `aadhaar` VARCHAR(12) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_mobile_key`(`mobile`),
    INDEX `customers_mobile_idx`(`mobile`),
    INDEX `customers_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collectors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `mobile` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `collectorId` VARCHAR(20) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `collectors_mobile_key`(`mobile`),
    UNIQUE INDEX `collectors_email_key`(`email`),
    UNIQUE INDEX `collectors_collectorId_key`(`collectorId`),
    INDEX `collectors_mobile_idx`(`mobile`),
    INDEX `collectors_isActive_idx`(`isActive`),
    INDEX `collectors_collectorId_idx`(`collectorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tokenNo` VARCHAR(50) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `collectorId` INTEGER NOT NULL,
    `loanAmount` DECIMAL(10, 2) NOT NULL,
    `interestType` ENUM('fixed', 'percentage') NOT NULL,
    `interestValue` DECIMAL(10, 2) NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `durationDays` INTEGER NOT NULL,
    `dailyInstallment` DECIMAL(10, 2) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('active', 'closed', 'overdue', 'cancelled') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tokens_tokenNo_key`(`tokenNo`),
    INDEX `tokens_tokenNo_idx`(`tokenNo`),
    INDEX `tokens_customerId_idx`(`customerId`),
    INDEX `tokens_collectorId_idx`(`collectorId`),
    INDEX `tokens_status_idx`(`status`),
    INDEX `tokens_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repayment_schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tokenId` INTEGER NOT NULL,
    `scheduleDate` DATE NOT NULL,
    `installmentAmount` DECIMAL(10, 2) NOT NULL,
    `penaltyAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalDue` DECIMAL(10, 2) NOT NULL,
    `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `paymentDate` DATE NULL,
    `status` ENUM('pending', 'paid', 'overdue', 'partial') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `repayment_schedule_tokenId_idx`(`tokenId`),
    INDEX `repayment_schedule_scheduleDate_idx`(`scheduleDate`),
    INDEX `repayment_schedule_status_idx`(`status`),
    INDEX `repayment_schedule_tokenId_scheduleDate_idx`(`tokenId`, `scheduleDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tokenId` INTEGER NOT NULL,
    `scheduleId` INTEGER NOT NULL,
    `collectorId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMode` ENUM('cash', 'upi', 'bank_transfer') NOT NULL DEFAULT 'cash',
    `paymentDate` DATE NOT NULL,
    `remarks` TEXT NULL,
    `isSynced` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_tokenId_idx`(`tokenId`),
    INDEX `payments_paymentDate_idx`(`paymentDate`),
    INDEX `payments_collectorId_idx`(`collectorId`),
    INDEX `payments_isSynced_idx`(`isSynced`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penalty_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penaltyType` ENUM('fixed', 'percent') NOT NULL,
    `penaltyValue` DECIMAL(10, 2) NOT NULL,
    `graceDays` INTEGER NOT NULL DEFAULT 0,
    `applyToLoanType` VARCHAR(50) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `penalty_config_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('super_admin', 'admin', 'director') NOT NULL DEFAULT 'admin',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_users_username_key`(`username`),
    UNIQUE INDEX `admin_users_email_key`(`email`),
    INDEX `admin_users_username_idx`(`username`),
    INDEX `admin_users_role_idx`(`role`),
    INDEX `admin_users_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_collector_assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `collectorId` INTEGER NOT NULL,
    `assignedDate` DATE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `customer_collector_assignment_customerId_idx`(`customerId`),
    INDEX `customer_collector_assignment_collectorId_idx`(`collectorId`),
    INDEX `customer_collector_assignment_isActive_idx`(`isActive`),
    UNIQUE INDEX `customer_collector_assignment_customerId_collectorId_key`(`customerId`, `collectorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_deposits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collectorId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `depositDate` DATE NOT NULL,
    `receiptUrl` VARCHAR(255) NULL,
    `verifiedBy` INTEGER NULL,
    `verificationDate` DATETIME(3) NULL,
    `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cash_deposits_collectorId_idx`(`collectorId`),
    INDEX `cash_deposits_depositDate_idx`(`depositDate`),
    INDEX `cash_deposits_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userType` ENUM('admin', 'collector', 'director') NOT NULL,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` INTEGER NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `system_logs_userId_idx`(`userId`),
    INDEX `system_logs_createdAt_idx`(`createdAt`),
    INDEX `system_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repayment_schedule` ADD CONSTRAINT `repayment_schedule_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `tokens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `tokens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `repayment_schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_collector_assignment` ADD CONSTRAINT `customer_collector_assignment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_collector_assignment` ADD CONSTRAINT `customer_collector_assignment_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_deposits` ADD CONSTRAINT `cash_deposits_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_deposits` ADD CONSTRAINT `cash_deposits_verifiedBy_fkey` FOREIGN KEY (`verifiedBy`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_logs` ADD CONSTRAINT `system_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
