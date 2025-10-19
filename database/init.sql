-- ============================================
-- RENTEASE PHILIPPINES DATABASE SCHEMA
-- Updated: October 19, 2025
-- For Docker PostgreSQL Setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin', 'staff');
CREATE TYPE transmission_type AS ENUM ('automatic', 'manual');
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');
CREATE TYPE vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'retired');
CREATE TYPE ownership_type AS ENUM ('rentease_owned', 'leased_from_owner');
CREATE TYPE reservation_status AS ENUM ('pending_payment', 'confirmed', 'active', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash');
CREATE TYPE payment_type AS ENUM ('deposit', 'full_payment', 'balance', 'additional_charges');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'completed', 'refunded');
CREATE TYPE maintenance_type AS ENUM ('routine', 'repair', 'inspection');
CREATE TYPE fuel_level AS ENUM ('empty', 'quarter', 'half', 'three_quarters', 'full');
CREATE TYPE contract_status AS ENUM ('active', 'expired', 'terminated');
CREATE TYPE owner_payment_type AS ENUM ('fixed_monthly', 'percentage_based', 'per_rental');
CREATE TYPE owner_payment_status AS ENUM ('pending', 'paid');
CREATE TYPE owner_payment_method AS ENUM ('cash', 'gcash', 'bank_transfer');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    driver_license_number VARCHAR(50),
    driver_license_expiry DATE,
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations/Branches
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    opening_hours TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Owners
CREATE TABLE vehicle_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(100),
    gcash_number VARCHAR(20),
    tax_id VARCHAR(50),
    contract_start_date DATE,
    contract_end_date DATE,
    contract_status contract_status DEFAULT 'active',
    payment_type owner_payment_type NOT NULL DEFAULT 'percentage_based',
    fixed_monthly_amount DECIMAL(10,2),
    percentage_share DECIMAL(5,2),
    total_earned DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Categories
CREATE TABLE vehicle_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE SET NULL,
    ownership_type ownership_type NOT NULL DEFAULT 'rentease_owned',
    vehicle_identification_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    category_id UUID REFERENCES vehicle_categories(id),
    transmission_type transmission_type NOT NULL,
    fuel_type fuel_type NOT NULL,
    seating_capacity INT NOT NULL,
    current_mileage INT DEFAULT 0,
    daily_rate DECIMAL(10,2) NOT NULL,
    hourly_late_fee DECIMAL(10,2) DEFAULT 200.00,
    status vehicle_status DEFAULT 'available',
    current_location_id UUID REFERENCES locations(id),
    home_location_id UUID REFERENCES locations(id),
    image_urls TEXT[],
    is_tracked BOOLEAN DEFAULT false,
    tracker_device_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Plans
CREATE TABLE insurance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    coverage_amount DECIMAL(12,2),
    daily_rate DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations/Bookings
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    pickup_location_id UUID REFERENCES locations(id),
    dropoff_location_id UUID REFERENCES locations(id),
    pickup_date TIMESTAMP NOT NULL,
    dropoff_date TIMESTAMP NOT NULL,
    insurance_plan_id UUID REFERENCES insurance_plans(id),
    status reservation_status DEFAULT 'pending_payment',
    base_amount DECIMAL(10,2) NOT NULL,
    insurance_amount DECIMAL(10,2) DEFAULT 0,
    deposit_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_type payment_type DEFAULT 'full_payment',
    gcash_number VARCHAR(20),
    gcash_reference VARCHAR(100),
    gcash_screenshot_url TEXT,
    received_by UUID REFERENCES users(id),
    payment_status payment_status DEFAULT 'pending',
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rentals
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    actual_pickup_date TIMESTAMP,
    actual_dropoff_date TIMESTAMP,
    pickup_location_id UUID REFERENCES locations(id),
    dropoff_location_id UUID REFERENCES locations(id),
    starting_mileage INT NOT NULL,
    ending_mileage INT,
    fuel_level_start fuel_level NOT NULL,
    fuel_level_end fuel_level,
    condition_notes_pickup TEXT,
    condition_notes_return TEXT,
    pickup_photos TEXT[],
    return_photos TEXT[],
    damage_reported BOOLEAN DEFAULT false,
    damage_description TEXT,
    damage_photos TEXT[],
    checked_in_by UUID REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    hours_late INT DEFAULT 0,
    late_return_fee DECIMAL(10,2) DEFAULT 0,
    fuel_charge DECIMAL(10,2) DEFAULT 0,
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    damage_charge DECIMAL(10,2) DEFAULT 0,
    additional_charges DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owner Payments
CREATE TABLE owner_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE CASCADE,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    total_rentals INT DEFAULT 0,
    total_rental_income DECIMAL(12,2) DEFAULT 0,
    owner_share DECIMAL(12,2) NOT NULL,
    rentease_share DECIMAL(12,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    deduction_notes TEXT,
    net_payment DECIMAL(12,2) NOT NULL,
    payment_method owner_payment_method NOT NULL,
    gcash_number VARCHAR(20),
    gcash_reference VARCHAR(100),
    payment_status owner_payment_status DEFAULT 'pending',
    paid_by UUID REFERENCES users(id),
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Records
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type maintenance_type NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    service_date DATE NOT NULL,
    next_service_date DATE,
    performed_by VARCHAR(255),
    mileage_at_service INT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Tracking
CREATE TABLE vehicle_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(6,2),
    heading DECIMAL(6,2),
    altitude DECIMAL(8,2),
    address TEXT,
    tracked_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    vehicle_condition_rating INT CHECK (vehicle_condition_rating >= 1 AND vehicle_condition_rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owner Access Logs
CREATE TABLE owner_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_location ON vehicles(current_location_id);
CREATE INDEX idx_vehicles_category ON vehicles(category_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_pickup_date ON reservations(pickup_date);
CREATE INDEX idx_rentals_reservation ON rentals(reservation_id);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate booking reference
CREATE SEQUENCE booking_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference := 'RENT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                            UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_ref BEFORE INSERT ON reservations
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Auto-calculate 20% deposit
CREATE OR REPLACE FUNCTION calculate_deposit()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deposit_amount := ROUND(NEW.total_amount * 0.20, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_deposit_trigger BEFORE INSERT ON reservations
    FOR EACH ROW EXECUTE FUNCTION calculate_deposit();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert admin and staff users
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@rentease.ph', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Admin', 'RentEase', 'admin'),
('staff@rentease.ph', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Staff', 'Member', 'staff');

-- Insert locations
INSERT INTO locations (name, address, city, province, phone_number, email, opening_hours) VALUES
('Manila Branch', '123 Rizal Avenue, Ermita', 'Manila', 'Metro Manila', '(02) 8123-4567', 'manila@rentease.ph', 'Mon-Sat: 8:00 AM - 6:00 PM'),
('Makati Branch', '789 Ayala Avenue, Makati CBD', 'Makati', 'Metro Manila', '(02) 8345-6789', 'makati@rentease.ph', 'Mon-Fri: 8:00 AM - 8:00 PM'),
('Quezon City Branch', '456 Commonwealth Avenue, Diliman', 'Quezon City', 'Metro Manila', '(02) 8234-5678', 'qc@rentease.ph', 'Mon-Sun: 7:00 AM - 7:00 PM');

-- Insert vehicle categories
INSERT INTO vehicle_categories (name, description) VALUES
('Small Car', 'Compact and fuel-efficient vehicles'),
('Sedan', 'Comfortable mid-size vehicles'),
('SUV', 'Spacious vehicles for families'),
('Van', 'Large passenger vehicles'),
('Luxury', 'Premium vehicles');

-- Insert insurance plans
INSERT INTO insurance_plans (name, description, coverage_amount, daily_rate, is_active) VALUES
('Basic Insurance', 'Basic coverage', 500000.00, 200.00, true),
('Premium Insurance', 'Comprehensive coverage', 1000000.00, 400.00, true);

-- Insert sample vehicles
INSERT INTO vehicles (ownership_type, vehicle_identification_number, make, model, year, color, license_plate, category_id, transmission_type, fuel_type, seating_capacity, current_mileage, daily_rate, hourly_late_fee, status, current_location_id, home_location_id) 
SELECT 
    'rentease_owned',
    'WAUZZZ8V8DA123456',
    'Toyota',
    'Vios',
    2023,
    'White',
    'ABC-1234',
    (SELECT id FROM vehicle_categories WHERE name = 'Sedan'),
    'automatic',
    'petrol',
    5,
    15000,
    2500.00,
    200.00,
    'available',
    (SELECT id FROM locations WHERE name = 'Manila Branch'),
    (SELECT id FROM locations WHERE name = 'Manila Branch');

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'Database initialization complete!';
    RAISE NOTICE 'Default admin: admin@rentease.ph / admin123';
    RAISE NOTICE 'Default staff: staff@rentease.ph / admin123';
END $$;