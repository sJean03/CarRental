-- ============================================
-- RENTEASE MARKETPLACE - SIMPLIFIED SCHEMA
-- Turo-Style P2P Car Rental Platform
-- Updated: October 25, 2025
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');
CREATE TYPE transmission_type AS ENUM ('automatic', 'manual');
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');
CREATE TYPE vehicle_status AS ENUM ('pending_approval', 'approved', 'listed', 'unavailable', 'suspended');
CREATE TYPE storage_option AS ENUM ('warehouse', 'owner_delivers');
CREATE TYPE booking_status AS ENUM (
    'pending_payment',
    'payment_confirmed',
    'pending_owner_confirmation',
    'confirmed',
    'awaiting_vehicle_dropoff',
    'ready_for_pickup',
    'active',
    'awaiting_return',
    'returned',
    'completed',
    'cancelled',
    'cancelled_with_refund'
);
CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card');
CREATE TYPE payment_plan_type AS ENUM ('full', 'installment');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE contract_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE damage_status AS ENUM ('reported', 'under_review', 'resolved');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users (Customers, Owners, Admin)
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
    drivers_license_photo_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    profile_photo_url TEXT,
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

-- Branches/Locations
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
    parking_capacity INT DEFAULT 50,
    monthly_storage_fee DECIMAL(10,2) DEFAULT 2000.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Categories
CREATE TABLE vehicle_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Owners (Extended profile for users who list cars)
CREATE TABLE vehicle_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    tax_id VARCHAR(50),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(100),
    preferred_payout_method payment_method DEFAULT 'debit',
    total_earnings DECIMAL(12,2) DEFAULT 0,
    total_rentals INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 100.00,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cars (Owner-listed vehicles)
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE CASCADE,
    
    -- Vehicle Details
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(50) UNIQUE,
    category_id UUID REFERENCES vehicle_categories(id),
    transmission transmission_type NOT NULL,
    fuel_type fuel_type NOT NULL,
    seating_capacity INT NOT NULL,
    
    -- Listing Details
    daily_rate DECIMAL(10,2) NOT NULL,
    description TEXT,
    features TEXT[], -- e.g., ['GPS', 'Bluetooth', 'Backup Camera']
    rules TEXT, -- Owner's rental rules
    image_urls TEXT[],
    
    -- Location & Storage
    home_branch_id UUID REFERENCES locations(id),
    storage_option storage_option DEFAULT 'owner_delivers',
    
    -- Status
    status vehicle_status DEFAULT 'pending_approval',
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Stats
    total_bookings INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Appointments (For owner onboarding)
CREATE TABLE contract_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES locations(id),
    
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    
    status contract_status DEFAULT 'scheduled',
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    
    admin_notes TEXT,
    contract_document_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car Availability (Owner-set calendar blocking)
CREATE TABLE car_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    
    blocked_from DATE NOT NULL,
    blocked_until DATE NOT NULL,
    
    reason TEXT, -- e.g., 'Personal use', 'Maintenance', 'Vacation'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings (Rentals)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    
    -- Parties
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE SET NULL,
    
    -- Dates & Location
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    total_days INT NOT NULL,
    branch_id UUID REFERENCES locations(id),
    
    -- Pricing
    daily_rate DECIMAL(10,2) NOT NULL, -- Snapshot of rate at booking time
    subtotal DECIMAL(10,2) NOT NULL, -- daily_rate * total_days
    platform_fee DECIMAL(10,2) NOT NULL, -- 10% of subtotal
    total_amount DECIMAL(10,2) NOT NULL, -- subtotal + platform_fee
    
    -- Payment
    payment_plan payment_plan_type DEFAULT 'full',
    installment_months INT, -- If payment_plan = 'installment'
    monthly_payment DECIMAL(10,2), -- If installment
    
    -- Status
    status booking_status DEFAULT 'pending_payment',
    
    -- Tracking
    owner_dropoff_at TIMESTAMP,
    customer_pickup_at TIMESTAMP,
    customer_return_at TIMESTAMP,
    owner_pickup_at TIMESTAMP,
    
    -- Late returns
    actual_return_date DATE,
    days_late INT DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Cancellation
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_plan payment_plan_type NOT NULL,
    
    -- For installments
    installment_number INT, -- e.g., 1 of 12
    is_initial_payment BOOLEAN DEFAULT false,
    
    -- Mock payment details
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20), -- 'Visa', 'Mastercard'
    transaction_id VARCHAR(100) UNIQUE,
    
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMP,
    
    -- Refunds
    refunded_amount DECIMAL(10,2) DEFAULT 0,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owner Payouts
CREATE TABLE owner_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE CASCADE,
    
    -- Calculation
    rental_amount DECIMAL(10,2) NOT NULL, -- Subtotal from booking
    platform_fee DECIMAL(10,2) NOT NULL, -- 10%
    warehouse_fee DECIMAL(10,2) DEFAULT 0, -- If stored
    late_fee_owner_share DECIMAL(10,2) DEFAULT 0, -- Owner gets 50% of late fees
    damage_deduction DECIMAL(10,2) DEFAULT 0,
    
    net_payout DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payout_method payment_method NOT NULL,
    bank_account VARCHAR(100),
    
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMP,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouse Storage Tracking
CREATE TABLE warehouse_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES locations(id),
    
    storage_start_date DATE NOT NULL,
    storage_end_date DATE,
    
    monthly_fee DECIMAL(10,2) NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Damages
CREATE TABLE damages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    
    reported_by UUID REFERENCES users(id),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    description TEXT NOT NULL,
    damage_photos TEXT[],
    
    estimated_cost DECIMAL(10,2),
    
    status damage_status DEFAULT 'reported',
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'booking_confirmed', 'car_approved', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Link to related record
    related_id UUID,
    related_type VARCHAR(50), -- 'booking', 'car', 'contract_appointment'
    
    action_url TEXT, -- Where to go when clicked
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cars_owner ON cars(owner_id);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_branch ON cars(home_branch_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_car ON bookings(car_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(pickup_date, return_date);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payouts_owner ON owner_payouts(owner_id);
CREATE INDEX idx_payouts_status ON owner_payouts(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_availability_car ON car_availability(car_id);

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

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_owners_updated_at BEFORE UPDATE ON vehicle_owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference := 'RE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                            UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_ref BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Calculate total days
CREATE OR REPLACE FUNCTION calculate_booking_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_days := (NEW.return_date - NEW.pickup_date) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_days BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_days();

-- Calculate pricing
CREATE OR REPLACE FUNCTION calculate_booking_pricing()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal
    NEW.subtotal := NEW.daily_rate * NEW.total_days;
    
    -- Platform fee (10%)
    NEW.platform_fee := ROUND(NEW.subtotal * 0.10, 2);
    
    -- Total amount
    NEW.total_amount := NEW.subtotal + NEW.platform_fee;
    
    -- If installment, calculate monthly payment
    IF NEW.payment_plan = 'installment' AND NEW.installment_months > 0 THEN
        NEW.monthly_payment := ROUND(NEW.total_amount / NEW.installment_months, 2);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_pricing BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_pricing();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('admin@rentease.ph', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Admin', 'RentEase', 'admin', true);

-- Insert branches (using your existing locations)
INSERT INTO locations (name, address, city, province, phone_number, email, opening_hours, parking_capacity, monthly_storage_fee) VALUES
('Manila Branch', '123 Rizal Avenue, Ermita', 'Manila', 'Metro Manila', '(02) 8123-4567', 'manila@rentease.ph', 'Mon-Sat: 8:00 AM - 6:00 PM', 50, 2000.00),
('Makati Branch', '789 Ayala Avenue, Makati CBD', 'Makati', 'Metro Manila', '(02) 8345-6789', 'makati@rentease.ph', 'Mon-Fri: 8:00 AM - 8:00 PM', 75, 2500.00),
('Quezon City Branch', '456 Commonwealth Avenue, Diliman', 'Quezon City', 'Metro Manila', '(02) 8234-5678', 'qc@rentease.ph', 'Mon-Sun: 7:00 AM - 7:00 PM', 100, 1800.00);

-- Insert vehicle categories
INSERT INTO vehicle_categories (name, description) VALUES
('Sedan', 'Comfortable mid-size vehicles perfect for daily commutes'),
('SUV', 'Spacious vehicles ideal for families and road trips'),
('Hatchback', 'Compact and fuel-efficient city cars'),
('Van', 'Large passenger vehicles for group travel'),
('Luxury', 'Premium vehicles for special occasions');

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '==================================';
    RAISE NOTICE 'RentEase Marketplace DB Ready!';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Default admin: admin@rentease.ph';
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE '3 Branches: Manila, Makati, QC';
    RAISE NOTICE '==================================';
END $$;