-- Database Schema for Billing Application
-- Database: if0_41211937_billing

CREATE TABLE IF NOT EXISTS `companies` (
    `id` VARCHAR(50) PRIMARY KEY,
    `parentId` VARCHAR(50),
    `name` VARCHAR(255),
    `type` VARCHAR(50),
    `contact` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(100),
    `industry` VARCHAR(100),
    `address` TEXT,
    `active` BOOLEAN,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` VARCHAR(50) PRIMARY KEY,
    `company` VARCHAR(255),
    `product` VARCHAR(255),
    `count` INT,
    `date` DATETIME,
    `status` VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS `manualBilling` (
    `id` VARCHAR(50) PRIMARY KEY,
    `company` VARCHAR(255),
    `description` TEXT,
    `amount` DECIMAL(10,2),
    `date` DATE,
    `status` VARCHAR(50),
    `createdBy` VARCHAR(255),
    `authorizedBy` VARCHAR(255),
    `authorizedDate` DATE
);

CREATE TABLE IF NOT EXISTS `batches` (
    `id` VARCHAR(50) PRIMARY KEY,
    `date` DATE,
    `description` TEXT,
    `status` VARCHAR(50),
    `records` INT,
    `createdBy` VARCHAR(255),
    `authorizedBy` VARCHAR(255),
    `authorizedDate` DATE
);

CREATE TABLE IF NOT EXISTS `usage_data` (
    `id` VARCHAR(50) PRIMARY KEY,
    `company` VARCHAR(255),
    `username` VARCHAR(255),
    `firstName` VARCHAR(255),
    `surname` VARCHAR(255),
    `product` VARCHAR(255),
    `input` VARCHAR(255),
    `output` VARCHAR(255),
    `date` DATETIME
);

CREATE TABLE IF NOT EXISTS `pricing` (
    `id` VARCHAR(50) PRIMARY KEY,
    `parentId` VARCHAR(50),
    `parentName` VARCHAR(255),
    `companyId` VARCHAR(50),
    `companyName` VARCHAR(255),
    `productName` VARCHAR(255),
    `rangeFrom` INT,
    `rangeTo` INT,
    `price` DECIMAL(10,2),
    `validFor` VARCHAR(100),
    `status` VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS `pricedTransactions` (
    `id` VARCHAR(50) PRIMARY KEY,
    `parent` VARCHAR(50),
    `companyId` VARCHAR(50),
    `company` VARCHAR(255),
    `product` VARCHAR(255),
    `transactions` INT,
    `rangeFrom` INT,
    `rangeTo` INT,
    `unitPrice` DECIMAL(10,2),
    `totalPrice` DECIMAL(10,2),
    `validFor` VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS `leads` (
    `id` VARCHAR(50) PRIMARY KEY,
    `firstName` VARCHAR(255),
    `lastName` VARCHAR(255),
    `company` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(100),
    `source` VARCHAR(100),
    `status` VARCHAR(50),
    `dateAdded` DATE,
    `assignedTo` VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS `activities` (
    `id` VARCHAR(50) PRIMARY KEY,
    `user` VARCHAR(255),
    `action` VARCHAR(255),
    `target` VARCHAR(255),
    `time` DATETIME
);

CREATE TABLE IF NOT EXISTS `supportTickets` (
    `id` VARCHAR(50) PRIMARY KEY,
    `company` VARCHAR(255),
    `subject` VARCHAR(255),
    `status` VARCHAR(50),
    `priority` VARCHAR(50),
    `createdBy` VARCHAR(255),
    `assignedTo` VARCHAR(255),
    `lastUpdated` DATETIME
);

CREATE TABLE IF NOT EXISTS `campaigns` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(255),
    `type` VARCHAR(100),
    `status` VARCHAR(50),
    `sent` INT,
    `opened` INT,
    `clicked` INT,
    `conversions` INT
);

CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(50) PRIMARY KEY,
    `firstName` VARCHAR(255),
    `lastName` VARCHAR(255),
    `email` VARCHAR(255),
    `role` VARCHAR(50),
    `userGroup` VARCHAR(50),
    `password` VARCHAR(255),
    `authorized` BOOLEAN,
    `lastLogin` DATETIME,
    `otp_code` VARCHAR(10),
    `otp_expiry` DATETIME
);

CREATE TABLE IF NOT EXISTS `auditLogs` (
    `id` VARCHAR(50) PRIMARY KEY,
    `timestamp` DATETIME,
    `user` VARCHAR(255),
    `action` VARCHAR(100),
    `entity` VARCHAR(100),
    `entityId` VARCHAR(50),
    `details` TEXT,
    `reason` TEXT,
    `oldValue` TEXT,
    `newValue` TEXT
);

CREATE TABLE IF NOT EXISTS `exceptions` (
    `id` VARCHAR(50) PRIMARY KEY,
    `company` VARCHAR(255),
    `product` VARCHAR(255),
    `description` TEXT,
    `date` DATE,
    `status` VARCHAR(50),
    `reason` VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(50) PRIMARY KEY,
    `user` VARCHAR(255),
    `title` VARCHAR(255),
    `message` TEXT,
    `type` VARCHAR(50),
    `date` DATETIME,
    `read_status` BOOLEAN
);

CREATE TABLE IF NOT EXISTS `waitingRoom` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(255),
    `email` VARCHAR(255),
    `date` DATETIME,
    `status` VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS `invoices` (
    `id` VARCHAR(50) PRIMARY KEY,
    `company` VARCHAR(255),
    `transactions` INT,
    `unitPrice` DECIMAL(10,2),
    `totalPrice` DECIMAL(10,2),
    `dueDate` DATE,
    `paidAmount` DECIMAL(10,2),
    `discount` DECIMAL(10,2),
    `outstanding` DECIMAL(10,2),
    `status` VARCHAR(50),
    `billingMonth` VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS `companyUsers` (
    `id` VARCHAR(50) PRIMARY KEY,
    `companyId` VARCHAR(50),
    `username` VARCHAR(255),
    `firstName` VARCHAR(255),
    `surname` VARCHAR(255),
    `position` VARCHAR(255),
    `lastLogin` DATETIME,
    `password` VARCHAR(255)
);
