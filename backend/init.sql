-- Initialize database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'%';
FLUSH PRIVILEGES;








