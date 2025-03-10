-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS devsecops;
USE devsecops;

-- Table des items avec validation et contraintes
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de l'utilisateur de l'application avec des privilèges restreints
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON devsecops.items TO 'app_user'@'%';
FLUSH PRIVILEGES;
