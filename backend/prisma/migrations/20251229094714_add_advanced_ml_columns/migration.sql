-- Add advanced ML model parameters to products table
-- These enable sophisticated forecasting with seasonality, EWMA, and trend analysis

ALTER TABLE `products` ADD COLUMN `modelSeasonality` JSON NULL COMMENT 'Weekly/monthly seasonal patterns';
ALTER TABLE `products` ADD COLUMN `modelTrendStrength` DECIMAL(5, 2) DEFAULT 0.0 NULL COMMENT 'Trend strength 0-100';
ALTER TABLE `products` ADD COLUMN `modelVolatility` DECIMAL(10, 6) DEFAULT 0.0 NULL COMMENT 'Demand volatility (coefficient of variation)';
ALTER TABLE `products` ADD COLUMN `modelEwmaAlpha` DECIMAL(5, 3) DEFAULT 0.3 NULL COMMENT 'EWMA smoothing factor (0-1)';






