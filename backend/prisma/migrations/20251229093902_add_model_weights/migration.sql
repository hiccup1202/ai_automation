-- Add model weight columns to products table for personalized ML predictions
-- These columns store the learned linear model parameters (y = ax + b) for each product

ALTER TABLE `products` ADD COLUMN `modelWeightA` DECIMAL(10, 6) DEFAULT 1.0 NULL COMMENT 'Slope of linear model (trend)';
ALTER TABLE `products` ADD COLUMN `modelWeightB` DECIMAL(10, 6) DEFAULT 0.0 NULL COMMENT 'Intercept of linear model (baseline)';
ALTER TABLE `products` ADD COLUMN `modelConfidence` DECIMAL(5, 2) DEFAULT 50.0 NULL COMMENT 'Model confidence score (0-100)';
ALTER TABLE `products` ADD COLUMN `modelTrainingCount` INT DEFAULT 0 NULL COMMENT 'Number of data points used in training';
ALTER TABLE `products` ADD COLUMN `modelLastUpdated` DATETIME NULL COMMENT 'Last time model was updated';







