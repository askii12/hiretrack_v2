-- AlterTable User: add role
ALTER TABLE `User` ADD COLUMN `role` ENUM('ADMIN', 'RECRUITER', 'CANDIDATE') NOT NULL DEFAULT 'CANDIDATE';

-- CreateTable Job
CREATE TABLE `Job` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `department` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `salaryMin` INTEGER NULL,
    `salaryMax` INTEGER NULL,
    `skills` TEXT NULL,
    `recruiterId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Candidate
CREATE TABLE `Candidate` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `resume` TEXT NULL,
    `skills` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Candidate_userId_key`(`userId`),
    UNIQUE INDEX `Candidate_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable hire_applications
CREATE TABLE `hire_applications` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NOT NULL,
    `status` ENUM('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'HIRED') NOT NULL DEFAULT 'APPLIED',
    `coverLetter` TEXT NULL,
    `interviewAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hire_applications_jobId_candidateId_key`(`jobId`, `candidateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Rename JobApplication table if needed (MySQL may already have JobApplication)
-- Add ActivityLog columns
ALTER TABLE `ActivityLog` ADD COLUMN `jobId` VARCHAR(191) NULL,
    ADD COLUMN `candidateId` VARCHAR(191) NULL,
    ADD COLUMN `hireApplicationId` VARCHAR(191) NULL;

-- AddForeignKeys
ALTER TABLE `Job` ADD CONSTRAINT `Job_recruiterId_fkey` FOREIGN KEY (`recruiterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Candidate` ADD CONSTRAINT `Candidate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `hire_applications` ADD CONSTRAINT `hire_applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `hire_applications` ADD CONSTRAINT `hire_applications_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `Candidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `Candidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_hireApplicationId_fkey` FOREIGN KEY (`hireApplicationId`) REFERENCES `hire_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
