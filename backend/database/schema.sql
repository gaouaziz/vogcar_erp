-- =============================================================================
-- VOGCAR ERP - SCHÉMA DE BASE DE DONNÉES (POSTGRESQL)
-- Module : Location de Véhicules (Car Rental System)
-- =============================================================================

-- Extension pour la génération de clés ou fonctions cryptographiques si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 0. FONCTION UTILITAIRE : Mise à jour automatique de "updated_at"
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. TABLE : Utilisateurs & Collaborateurs (users)
-- Gestion des accès au système ERP (Admin, Manager, Agent)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'AGENT' CHECK (role IN ('ADMIN', 'MANAGER', 'AGENT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. TABLE : Catégories de Véhicules (vehicle_categories)
-- Segments de véhicules (Économique, Berline, SUV, Utilitaire, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 40.00,
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. TABLE : Flotte Automobile / Voitures (vehicles)
-- Chaque véhicule physique de la flotte
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES vehicle_categories(id) ON DELETE SET NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,  -- Plaque d'immatriculation (ex: AA-123-BB)
    vin VARCHAR(100) UNIQUE,                          -- Numéro de châssis
    brand VARCHAR(100) NOT NULL,                      -- Marque (Peugeot, Renault, etc.)
    model VARCHAR(100) NOT NULL,                      -- Modèle (208, Clio, etc.)
    year INT NOT NULL,                                -- Année de mise en circulation
    color VARCHAR(50),                                -- Couleur
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'PETROL' CHECK (fuel_type IN ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC')),
    transmission VARCHAR(50) NOT NULL DEFAULT 'MANUAL' CHECK (transmission IN ('MANUAL', 'AUTOMATIC')),
    seats INT NOT NULL DEFAULT 5,                     -- Nombre de places
    current_mileage INT NOT NULL DEFAULT 0,           -- Kilométrage compteur actuel
    daily_rate NUMERIC(10, 2),                        -- Tarif spécifique au véhicule (si NULL -> utilise celui de la catégorie)
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE')),
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. TABLE : Clients / Conducteurs (clients)
-- Clients particuliers ou professionnels
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    national_id_number VARCHAR(100),                  -- CNI ou Passeport
    driving_license_number VARCHAR(100) NOT NULL UNIQUE, -- Numéro de permis de conduire
    driving_license_issue_date DATE,
    driving_license_expiry DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'France',
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,    -- Client interdit de location (contentieux)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. TABLE : Réservations & Contrats de Location (bookings)
-- Contrats de location liant un client, un véhicule et des dates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) NOT NULL UNIQUE,     -- Référence unique (ex: BK-2026-0001)
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL, -- Agent ayant saisi le contrat
    
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,      -- Début prévu de location
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,        -- Fin prévue de location
    actual_return_date TIMESTAMP WITH TIME ZONE,       -- Date/heure de restitution réelle
    
    pickup_location VARCHAR(150) DEFAULT 'Agence Principale',
    return_location VARCHAR(150) DEFAULT 'Agence Principale',
    
    start_mileage INT,                                 -- Kilométrage au départ
    end_mileage INT,                                   -- Kilométrage au retour
    
    daily_rate NUMERIC(10, 2) NOT NULL,                -- Tarif jour appliqué au contrat
    total_days INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL,               -- Montant total TTC
    
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Montant de la caution
    deposit_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (deposit_status IN ('PENDING', 'HELD', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FORFEITED')),
    
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_booking_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. TABLE : Règlements & Paiements (payments)
-- Traçabilité de chaque paiement (acompte, solde, caution, remboursement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CREDIT_CARD', 'CASH', 'BANK_TRANSFER', 'CHECK')),
    payment_type VARCHAR(50) NOT NULL DEFAULT 'RENTAL' CHECK (payment_type IN ('RENTAL', 'DEPOSIT', 'EXTRA_CHARGE', 'REFUND')),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    transaction_id VARCHAR(150),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. TABLE : États des Lieux / Inspections (inspections)
-- Contrôle départ (Check-out) et retour (Check-in) du véhicule
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    inspector_id INT REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CHECK_OUT', 'CHECK_IN')), -- CHECK_OUT: départ, CHECK_IN: retour
    mileage INT NOT NULL,
    fuel_level VARCHAR(50) NOT NULL CHECK (fuel_level IN ('EMPTY', '1/4', '1/2', '3/4', 'FULL')),
    cleanliness VARCHAR(50) NOT NULL DEFAULT 'CLEAN' CHECK (cleanliness IN ('CLEAN', 'NORMAL', 'DIRTY')),
    damages_description TEXT,
    photos_urls TEXT[],
    signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. TABLE : Maintenance & Entretiens (maintenances)
-- Suivi atelier, contrôles techniques, réparations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenances (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL CHECK (type IN ('PERIODIC_SERVICE', 'OIL_CHANGE', 'TIRES', 'BRAKES', 'TECHNICAL_INSPECTION', 'REPAIR', 'OTHER')),
    service_date DATE NOT NULL,
    mileage_at_service INT,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    service_provider VARCHAR(150),                     -- Nom du garage / prestataire
    invoice_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEX DE PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_inspections_booking ON inspections(booking_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle ON maintenances(vehicle_id);

-- -----------------------------------------------------------------------------
-- DONNÉES DE DÉPART / SEEDS (Exemples pour démarrer immédiatement)
-- -----------------------------------------------------------------------------
INSERT INTO vehicle_categories (name, slug, description, base_daily_rate, deposit_amount)
VALUES 
    ('Économique', 'economique', 'Citadines idéales pour les trajets urbains', 35.00, 500.00),
    ('Compacte / Berline', 'berline', 'Confortable pour les longs trajets et voyages professionnels', 55.00, 800.00),
    ('SUV / Familiale', 'suv', 'Espace généreux pour les familles et aventures', 75.00, 1000.00),
    ('Utilitaire', 'utilitaire', 'Idéal pour déménagements et transport de marchandises', 65.00, 1200.00)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES 
    ('Admin', 'VogCar', 'admin@vogcar.fr', '$2b$10$wT3WvjG6uJ7g2lE19aK1veH8wQk20N7c2Y6.8X0d1qgL6eEa3rWCe', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vehicles (category_id, registration_number, vin, brand, model, year, color, fuel_type, transmission, current_mileage, status)
VALUES 
    (1, 'EF-123-AB', 'VF30A9HP4ES123456', 'Peugeot', '208', 2023, 'Blanc', 'PETROL', 'MANUAL', 18500, 'AVAILABLE'),
    (1, 'GH-456-CD', 'VF15R240E59876543', 'Renault', 'Clio V', 2024, 'Gris Titanium', 'HYBRID', 'AUTOMATIC', 9200, 'AVAILABLE'),
    (2, 'JK-789-EF', 'VF73D9HR8DS456789', 'Volkswagen', 'Golf 8', 2023, 'Noir Intense', 'DIESEL', 'AUTOMATIC', 34200, 'AVAILABLE'),
    (3, 'LM-012-GH', 'VF1HJD20658492019', 'Renault', 'Austral', 2024, 'Bleu Sommet', 'HYBRID', 'AUTOMATIC', 11000, 'AVAILABLE')
ON CONFLICT (registration_number) DO NOTHING;

INSERT INTO clients (first_name, last_name, email, phone, driving_license_number, city)
VALUES 
    ('Jean', 'Dupont', 'jean.dupont@email.fr', '+33 6 12 34 56 78', '12AA34567', 'Paris'),
    ('Sophie', 'Martin', 'sophie.martin@email.fr', '+33 6 98 76 54 32', '34BB78901', 'Lyon')
ON CONFLICT (driving_license_number) DO NOTHING;
