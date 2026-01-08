-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `payments_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `payments_tokenId_fkey`;

-- AlterTable
ALTER TABLE `collectors` ADD COLUMN `plainPassword` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `createdBy` ENUM('admin', 'collector', 'director') NOT NULL DEFAULT 'admin',
    ADD COLUMN `customerId` INTEGER NULL,
    ADD COLUMN `isMultiToken` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `photoUrl` LONGTEXT NULL,
    MODIFY `tokenId` INTEGER NULL,
    MODIFY `scheduleId` INTEGER NULL;

-- AlterTable
ALTER TABLE `tokens` ADD COLUMN `batchId` INTEGER NULL,
    ADD COLUMN `createdBy` ENUM('admin', 'collector', 'director') NOT NULL DEFAULT 'admin';

-- CreateTable
CREATE TABLE `token_batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchNo` VARCHAR(50) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `collectorId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `loanAmount` DECIMAL(10, 2) NOT NULL,
    `totalBatchAmount` DECIMAL(10, 2) NOT NULL,
    `interestType` ENUM('fixed', 'percentage') NOT NULL,
    `interestValue` DECIMAL(10, 2) NOT NULL,
    `durationDays` INTEGER NOT NULL,
    `dailyInstallment` DECIMAL(10, 2) NOT NULL,
    `totalDailyAmount` DECIMAL(10, 2) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('active', 'closed', 'overdue', 'cancelled') NOT NULL DEFAULT 'active',
    `createdBy` ENUM('admin', 'collector', 'director') NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `token_batches_batchNo_key`(`batchNo`),
    INDEX `token_batches_batchNo_idx`(`batchNo`),
    INDEX `token_batches_customerId_idx`(`customerId`),
    INDEX `token_batches_collectorId_idx`(`collectorId`),
    INDEX `token_batches_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_repayment_schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `scheduleDate` DATE NOT NULL,
    `installmentAmount` DECIMAL(10, 2) NOT NULL,
    `penaltyPerToken` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalPenalty` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalDue` DECIMAL(10, 2) NOT NULL,
    `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `penaltyWaived` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `paymentDate` DATE NULL,
    `status` ENUM('pending', 'paid', 'overdue', 'partial') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `batch_repayment_schedule_batchId_idx`(`batchId`),
    INDEX `batch_repayment_schedule_scheduleDate_idx`(`scheduleDate`),
    INDEX `batch_repayment_schedule_status_idx`(`status`),
    INDEX `batch_repayment_schedule_batchId_scheduleDate_idx`(`batchId`, `scheduleDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `scheduleId` INTEGER NOT NULL,
    `collectorId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `penaltyWaived` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `paymentMode` ENUM('cash', 'upi', 'bank_transfer') NOT NULL DEFAULT 'cash',
    `paymentDate` DATE NOT NULL,
    `remarks` TEXT NULL,
    `photoUrl` LONGTEXT NULL,
    `isSynced` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` ENUM('admin', 'collector', 'director') NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `batch_payments_batchId_idx`(`batchId`),
    INDEX `batch_payments_scheduleId_idx`(`scheduleId`),
    INDEX `batch_payments_paymentDate_idx`(`paymentDate`),
    INDEX `batch_payments_collectorId_idx`(`collectorId`),
    INDEX `batch_payments_isSynced_idx`(`isSynced`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_allocations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `tokenId` INTEGER NOT NULL,
    `scheduleId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_allocations_paymentId_idx`(`paymentId`),
    INDEX `payment_allocations_tokenId_idx`(`tokenId`),
    INDEX `payment_allocations_scheduleId_idx`(`scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collector_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collectorId` INTEGER NOT NULL,
    `currentBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `collector_accounts_collectorId_key`(`collectorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collector_account_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collectorAccountId` INTEGER NOT NULL,
    `transactionType` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balanceAfter` DECIMAL(10, 2) NOT NULL,
    `referenceType` VARCHAR(50) NULL,
    `referenceId` INTEGER NULL,
    `description` TEXT NULL,
    `createdBy` INTEGER NULL,
    `createdByType` ENUM('admin', 'collector', 'director') NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `collector_account_transactions_collectorAccountId_idx`(`collectorAccountId`),
    INDEX `collector_account_transactions_transactionDate_idx`(`transactionDate`),
    INDEX `collector_account_transactions_transactionType_idx`(`transactionType`),
    INDEX `collector_account_transactions_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `currentBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_accounts_adminId_key`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_account_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminAccountId` INTEGER NOT NULL,
    `transactionType` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balanceAfter` DECIMAL(10, 2) NOT NULL,
    `referenceType` VARCHAR(50) NULL,
    `referenceId` INTEGER NULL,
    `description` TEXT NULL,
    `createdBy` INTEGER NULL,
    `createdByType` ENUM('admin', 'collector', 'director') NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_account_transactions_adminAccountId_idx`(`adminAccountId`),
    INDEX `admin_account_transactions_transactionDate_idx`(`transactionDate`),
    INDEX `admin_account_transactions_transactionType_idx`(`transactionType`),
    INDEX `admin_account_transactions_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `payments_customerId_idx` ON `payments`(`customerId`);

-- CreateIndex
CREATE INDEX `payments_isMultiToken_idx` ON `payments`(`isMultiToken`);

-- CreateIndex
CREATE INDEX `tokens_batchId_idx` ON `tokens`(`batchId`);

-- AddForeignKey
ALTER TABLE `token_batches` ADD CONSTRAINT `token_batches_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_batches` ADD CONSTRAINT `token_batches_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_repayment_schedule` ADD CONSTRAINT `batch_repayment_schedule_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `token_batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_payments` ADD CONSTRAINT `batch_payments_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `token_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_payments` ADD CONSTRAINT `batch_payments_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `batch_repayment_schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `token_batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `tokens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `repayment_schedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_allocations` ADD CONSTRAINT `payment_allocations_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_allocations` ADD CONSTRAINT `payment_allocations_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `tokens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_allocations` ADD CONSTRAINT `payment_allocations_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `repayment_schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collector_accounts` ADD CONSTRAINT `collector_accounts_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collector_account_transactions` ADD CONSTRAINT `collector_account_transactions_collectorAccountId_fkey` FOREIGN KEY (`collectorAccountId`) REFERENCES `collector_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_accounts` ADD CONSTRAINT `admin_accounts_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_account_transactions` ADD CONSTRAINT `admin_account_transactions_adminAccountId_fkey` FOREIGN KEY (`adminAccountId`) REFERENCES `admin_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
