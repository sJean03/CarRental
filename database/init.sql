-- ============================================
-- RENTEASE MARKETPLACE - COMPREHENSIVE SAMPLE DATA
-- Turo-Style P2P Car Rental Platform
-- UPDATED: Add Downpayment Columns
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');
CREATE TYPE transmission_type AS ENUM ('automatic', 'manual');
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');
CREATE TYPE vehicle_status AS ENUM ('pending_approval', 'approved', 'listed', 'unavailable', 'suspended', 'rejected');
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
CREATE TYPE payment_plan_type AS ENUM ('downpayment', 'installment');
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
    preferred_payout_method payment_method DEFAULT 'debit_card',
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

-- Bookings (Rentals) - UPDATED WITH DOWNPAYMENT COLUMNS
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
    platform_fee DECIMAL(10,2) NOT NULL, -- 2% of subtotal (FIXED)
    total_amount DECIMAL(10,2) NOT NULL, -- subtotal + platform_fee

    -- Payment - UPDATED: Added downpayment columns
    payment_plan payment_plan_type DEFAULT 'downpayment',
    installment_months INT, -- If payment_plan = 'installment'
    monthly_payment DECIMAL(10,2), -- If installment
    downpayment DECIMAL(10,2), -- NEW: 20% down payment
    remaining_balance DECIMAL(10,2), -- NEW: 80% remaining balance
    remaining_balance_paid BOOLEAN DEFAULT false, -- NEW: Track if remaining balance paid

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

    -- For down payment
    is_down_payment BOOLEAN DEFAULT false, -- True if this is the 20% down payment
    is_remaining_balance BOOLEAN DEFAULT false, -- True if this is the 80% pickup payment

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
    platform_fee DECIMAL(10,2) NOT NULL, -- 2%
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

-- Calculate pricing with 2% platform fee and downpayment
CREATE OR REPLACE FUNCTION calculate_booking_pricing()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal
    NEW.subtotal := NEW.daily_rate * NEW.total_days;

    -- Platform fee (2% - FIXED)
    NEW.platform_fee := ROUND(NEW.subtotal * 0.02, 2);

    -- Total amount
    NEW.total_amount := NEW.subtotal + NEW.platform_fee;

    -- If installment, calculate monthly payment
    IF NEW.payment_plan = 'installment' AND NEW.installment_months > 0 THEN
        NEW.monthly_payment := ROUND(NEW.total_amount / NEW.installment_months, 2);
    END IF;

    -- If downpayment, calculate down payment (20%) and remaining balance (80%)
    IF NEW.payment_plan = 'downpayment' THEN
        NEW.downpayment := ROUND(NEW.total_amount * 0.20, 2);
        NEW.remaining_balance := NEW.total_amount - NEW.downpayment;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_pricing BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_pricing();

-- ============================================
-- COMPREHENSIVE SAMPLE DATA
-- Simulating 1 Week of RentEase Operations
-- ============================================

-- ============================================
-- 1. LOCATIONS / BRANCHES
-- ============================================

INSERT INTO locations (id, name, address, city, province, phone_number, email, opening_hours, parking_capacity, monthly_storage_fee, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Manila Branch', '123 Rizal Avenue, Ermita', 'Manila', 'Metro Manila', '(02) 8123-4567', 'manila@rentease.ph', 'Mon-Sat: 8:00 AM - 6:00 PM', 50, 2000.00, NOW() - INTERVAL '7 days'),
('22222222-2222-2222-2222-222222222222', 'Makati Branch', '789 Ayala Avenue, Makati CBD', 'Makati', 'Metro Manila', '(02) 8345-6789', 'makati@rentease.ph', 'Mon-Fri: 8:00 AM - 8:00 PM', 75, 2500.00, NOW() - INTERVAL '7 days'),
('33333333-3333-3333-3333-333333333333', 'Quezon City Branch', '456 Commonwealth Avenue, Diliman', 'Quezon City', 'Metro Manila', '(02) 8234-5678', 'qc@rentease.ph', 'Mon-Sun: 7:00 AM - 7:00 PM', 100, 1800.00, NOW() - INTERVAL '7 days'),
('44444444-4444-4444-4444-444444444444', 'Pasig Branch', '234 Ortigas Avenue, Kapitolyo', 'Pasig', 'Metro Manila', '(02) 8456-7890', 'pasig@rentease.ph', 'Mon-Sun: 8:00 AM - 8:00 PM', 60, 2200.00, NOW() - INTERVAL '5 days');

-- ============================================
-- 2. VEHICLE CATEGORIES
-- ============================================

INSERT INTO vehicle_categories (id, name, description, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sedan', 'Comfortable mid-size vehicles perfect for daily commutes', NOW() - INTERVAL '7 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SUV', 'Spacious vehicles ideal for families and road trips', NOW() - INTERVAL '7 days'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Hatchback', 'Compact and fuel-efficient city cars', NOW() - INTERVAL '7 days'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Van', 'Large passenger vehicles for group travel', NOW() - INTERVAL '7 days'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Luxury', 'Premium vehicles for special occasions', NOW() - INTERVAL '7 days');

-- ============================================
-- 3. USERS (Admins, Customers, Owners)
-- Password for all: password123
-- Hash: $2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK
-- ============================================

-- Admin
INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number, role, is_verified, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@rentease.ph', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Admin', 'RentEase', '(02) 8000-0000', 'admin', true, true, NOW() - INTERVAL '7 days');

-- Car Owners (7 owners)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number, date_of_birth, driver_license_number, driver_license_expiry, role, is_verified, is_active, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'juan.delacruz@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Juan', 'Dela Cruz', '+63 917 123 4567', '1985-03-15', 'N01-85-123456', '2027-03-15', 'owner', true, true, NOW() - INTERVAL '7 days'),
('10000000-0000-0000-0000-000000000002', 'maria.santos@yahoo.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Maria', 'Santos', '+63 918 234 5678', '1990-07-22', 'N01-90-234567', '2028-07-22', 'owner', true, true, NOW() - INTERVAL '6 days'),
('10000000-0000-0000-0000-000000000003', 'carlos.reyes@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Carlos', 'Reyes', '+63 919 345 6789', '1988-11-30', 'N01-88-345678', '2026-11-30', 'owner', true, true, NOW() - INTERVAL '6 days'),
('10000000-0000-0000-0000-000000000004', 'ana.garcia@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Ana', 'Garcia', '+63 920 456 7890', '1992-05-18', 'N01-92-456789', '2029-05-18', 'owner', true, true, NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000005', 'roberto.mendoza@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Roberto', 'Mendoza', '+63 921 567 8901', '1987-09-12', 'N01-87-567890', '2027-09-12', 'owner', true, true, NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000006', 'lisa.torres@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Lisa', 'Torres', '+63 922 678 9012', '1995-02-25', 'N01-95-678901', '2028-02-25', 'owner', true, true, NOW() - INTERVAL '4 days'),
('10000000-0000-0000-0000-000000000007', 'michael.cruz@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Michael', 'Cruz', '+63 923 789 0123', '1991-12-08', 'N01-91-789012', '2029-12-08', 'owner', false, true, NOW() - INTERVAL '2 days');

-- Customers (10 customers)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number, date_of_birth, driver_license_number, driver_license_expiry, role, is_verified, is_active, created_at) VALUES
('20000000-0000-0000-0000-000000000001', 'peter.tan@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Peter', 'Tan', '+63 915 111 2222', '1993-04-10', 'N01-93-111222', '2027-04-10', 'customer', true, true, NOW() - INTERVAL '6 days'),
('20000000-0000-0000-0000-000000000002', 'sarah.lim@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Sarah', 'Lim', '+63 916 222 3333', '1994-08-20', 'N01-94-222333', '2028-08-20', 'customer', true, true, NOW() - INTERVAL '6 days'),
('20000000-0000-0000-0000-000000000003', 'david.wong@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'David', 'Wong', '+63 917 333 4444', '1989-01-15', 'N01-89-333444', '2026-01-15', 'customer', true, true, NOW() - INTERVAL '5 days'),
('20000000-0000-0000-0000-000000000004', 'michelle.ng@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Michelle', 'Ng', '+63 918 444 5555', '1996-06-25', 'N01-96-444555', '2029-06-25', 'customer', true, true, NOW() - INTERVAL '5 days'),
('20000000-0000-0000-0000-000000000005', 'james.lee@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'James', 'Lee', '+63 919 555 6666', '1991-10-05', 'N01-91-555666', '2027-10-05', 'customer', true, true, NOW() - INTERVAL '4 days'),
('20000000-0000-0000-0000-000000000006', 'angela.chen@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Angela', 'Chen', '+63 920 666 7777', '1997-03-18', 'N01-97-666777', '2028-03-18', 'customer', true, true, NOW() - INTERVAL '4 days'),
('20000000-0000-0000-0000-000000000007', 'kevin.garcia@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Kevin', 'Garcia', '+63 921 777 8888', '1990-11-28', 'N01-90-777888', '2026-11-28', 'customer', true, true, NOW() - INTERVAL '3 days'),
('20000000-0000-0000-0000-000000000008', 'jennifer.ramos@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Jennifer', 'Ramos', '+63 922 888 9999', '1995-07-14', 'N01-95-888999', '2029-07-14', 'customer', true, true, NOW() - INTERVAL '3 days'),
('20000000-0000-0000-0000-000000000009', 'mark.santos@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Mark', 'Santos', '+63 923 999 0000', '1988-12-22', 'N01-88-999000', '2027-12-22', 'customer', true, true, NOW() - INTERVAL '2 days'),
('20000000-0000-0000-0000-000000000010', 'christine.rivera@gmail.com', '$2b$10$MIwlerjgTPHyaQTkLnbMKefXkevB8ww7zyRe5.WtqL1ogj6IoBNtK', 'Christine', 'Rivera', '+63 924 000 1111', '1992-09-03', 'N01-92-000111', '2028-09-03', 'customer', false, true, NOW() - INTERVAL '1 day');

-- ============================================
-- 4. ADDRESSES
-- ============================================

-- Addresses for owners
INSERT INTO addresses (user_id, street_address, city, province, postal_code, is_default, created_at) VALUES
('10000000-0000-0000-0000-000000000001', '123 Mabini Street, Ermita', 'Manila', 'Metro Manila', '1000', true, NOW() - INTERVAL '7 days'),
('10000000-0000-0000-0000-000000000002', '456 Jupiter Street, Bel-Air', 'Makati', 'Metro Manila', '1209', true, NOW() - INTERVAL '6 days'),
('10000000-0000-0000-0000-000000000003', '789 Timog Avenue, South Triangle', 'Quezon City', 'Metro Manila', '1103', true, NOW() - INTERVAL '6 days'),
('10000000-0000-0000-0000-000000000004', '234 Kapitolyo Street, Kapitolyo', 'Pasig', 'Metro Manila', '1603', true, NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000005', '567 Katipunan Avenue, Loyola Heights', 'Quezon City', 'Metro Manila', '1108', true, NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000006', '890 Salcedo Street, Legaspi Village', 'Makati', 'Metro Manila', '1229', true, NOW() - INTERVAL '4 days'),
('10000000-0000-0000-0000-000000000007', '345 Tomas Morato Avenue, South Triangle', 'Quezon City', 'Metro Manila', '1103', true, NOW() - INTERVAL '2 days');

-- Addresses for customers
INSERT INTO addresses (user_id, street_address, city, province, postal_code, is_default, created_at) VALUES
('20000000-0000-0000-0000-000000000001', '111 Roxas Boulevard, Malate', 'Manila', 'Metro Manila', '1004', true, NOW() - INTERVAL '6 days'),
('20000000-0000-0000-0000-000000000002', '222 EDSA, Guadalupe', 'Makati', 'Metro Manila', '1212', true, NOW() - INTERVAL '6 days'),
('20000000-0000-0000-0000-000000000003', '333 Aurora Boulevard, Cubao', 'Quezon City', 'Metro Manila', '1109', true, NOW() - INTERVAL '5 days'),
('20000000-0000-0000-0000-000000000004', '444 Shaw Boulevard, Wack-Wack', 'Mandaluyong', 'Metro Manila', '1552', true, NOW() - INTERVAL '5 days'),
('20000000-0000-0000-0000-000000000005', '555 C5 Road, Libis', 'Quezon City', 'Metro Manila', '1110', true, NOW() - INTERVAL '4 days'),
('20000000-0000-0000-0000-000000000006', '666 Ortigas Avenue, Ortigas Center', 'Pasig', 'Metro Manila', '1605', true, NOW() - INTERVAL '4 days'),
('20000000-0000-0000-0000-000000000007', '777 Macapagal Avenue, Bay City', 'Pasay', 'Metro Manila', '1308', true, NOW() - INTERVAL '3 days'),
('20000000-0000-0000-0000-000000000008', '888 Quirino Avenue, Malate', 'Manila', 'Metro Manila', '1004', true, NOW() - INTERVAL '3 days'),
('20000000-0000-0000-0000-000000000009', '999 Buendia Avenue, Bel-Air', 'Makati', 'Metro Manila', '1209', true, NOW() - INTERVAL '2 days'),
('20000000-0000-0000-0000-000000000010', '101 España Boulevard, Sampaloc', 'Manila', 'Metro Manila', '1008', true, NOW() - INTERVAL '1 day');

-- ============================================
-- 5. VEHICLE OWNERS (Extended Profiles)
-- ============================================

INSERT INTO vehicle_owners (id, user_id, business_name, tax_id, bank_account_number, bank_name, preferred_payout_method, total_earnings, total_rentals, average_rating, response_rate, is_verified, created_at) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'JDC Auto Rentals', 'TIN-123-456-789', '1234567890', 'BDO', 'debit_card', 45000.00, 5, 4.8, 98.50, true, NOW() - INTERVAL '7 days'),
('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Maria''s Wheels', 'TIN-234-567-890', '2345678901', 'BPI', 'credit_card', 32000.00, 4, 4.9, 100.00, true, NOW() - INTERVAL '6 days'),
('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Reyes Car Services', 'TIN-345-678-901', '3456789012', 'Metrobank', 'debit_card', 28000.00, 3, 4.7, 95.00, true, NOW() - INTERVAL '6 days'),
('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', NULL, 'TIN-456-789-012', '4567890123', 'Security Bank', 'debit_card', 15000.00, 2, 5.0, 100.00, true, NOW() - INTERVAL '5 days'),
('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'RM Premium Cars', 'TIN-567-890-123', '5678901234', 'BDO', 'credit_card', 52000.00, 6, 4.9, 97.00, true, NOW() - INTERVAL '5 days'),
('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', NULL, 'TIN-678-901-234', '6789012345', 'BPI', 'debit_card', 8000.00, 1, 4.5, 100.00, true, NOW() - INTERVAL '4 days'),
('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Cruz Transport', 'TIN-789-012-345', '7890123456', 'Unionbank', 'debit_card', 0.00, 0, 0.0, 100.00, false, NOW() - INTERVAL '2 days');

-- ============================================
-- 6. CARS (Various statuses and types)
-- ============================================

INSERT INTO cars (id, owner_id, make, model, year, color, license_plate, vin, category_id, transmission, fuel_type, seating_capacity, daily_rate, description, features, rules, image_urls, home_branch_id, storage_option, status, total_bookings, average_rating, created_at) VALUES
-- Juan's Cars (2 cars)
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Toyota', 'Vios', 2020, 'Silver', 'ABC-1234', 'VIN001234567890001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'automatic', 'petrol', 5, 1500.00, 'Well-maintained Toyota Vios perfect for city driving. Fuel-efficient and reliable.', ARRAY['Bluetooth', 'USB Port', 'Air Conditioning', 'Backup Camera'], 'No smoking. No pets. Return with full tank.', ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'], '11111111-1111-1111-1111-111111111111', 'warehouse', 'listed', 5, 4.8, NOW() - INTERVAL '7 days'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Honda', 'City', 2021, 'White', 'DEF-5678', 'VIN001234567890002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'automatic', 'petrol', 5, 1600.00, 'Brand new Honda City with modern features and excellent fuel economy.', ARRAY['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof'], 'No smoking. Maximum 4 passengers.', ARRAY['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800'], '11111111-1111-1111-1111-111111111111', 'warehouse', 'listed', 3, 4.9, NOW() - INTERVAL '7 days'),

-- Maria's Cars (2 cars)
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'Mitsubishi', 'Montero Sport', 2019, 'Black', 'GHI-9012', 'VIN001234567890003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'automatic', 'diesel', 7, 3500.00, 'Spacious SUV perfect for family trips and weekend getaways. Powerful and comfortable.', ARRAY['GPS', 'Bluetooth', '4WD', 'Parking Sensors', 'Third Row Seats'], 'No off-roading. Return clean. Extra charge for excessive dirt.', ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'], '22222222-2222-2222-2222-222222222222', 'owner_delivers', 'listed', 4, 4.9, NOW() - INTERVAL '6 days'),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'Toyota', 'Fortuner', 2022, 'White', 'JKL-3456', 'VIN001234567890004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'automatic', 'diesel', 7, 4000.00, 'Latest model Fortuner with all premium features. Ideal for long trips.', ARRAY['GPS', 'Bluetooth', 'Leather Seats', '4WD', 'Apple CarPlay'], 'No smoking. Licensed drivers only.', ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'], '22222222-2222-2222-2222-222222222222', 'owner_delivers', 'listed', 2, 5.0, NOW() - INTERVAL '6 days'),

-- Carlos's Cars (1 car)
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'Mazda', '3', 2020, 'Red', 'MNO-7890', 'VIN001234567890005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'automatic', 'petrol', 5, 1800.00, 'Stylish Mazda 3 with sporty design and smooth handling.', ARRAY['Bluetooth', 'Backup Camera', 'Cruise Control'], 'No smoking. Return on time to avoid late fees.', ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800', 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=800'], '33333333-3333-3333-3333-333333333333', 'warehouse', 'listed', 3, 4.7, NOW() - INTERVAL '6 days'),

-- Ana's Car (1 car)
('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', 'Honda', 'Jazz', 2021, 'Blue', 'PQR-2345', 'VIN001234567890006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'automatic', 'petrol', 5, 1400.00, 'Compact and practical Honda Jazz. Great for city navigation and parking.', ARRAY['Bluetooth', 'USB Port', 'Air Conditioning'], 'No smoking. Keep it clean.', ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Honda_Jazz_Hybrid_Executive_%28IV%29_%E2%80%93_f_18102020.jpg/1200px-Honda_Jazz_Hybrid_Executive_%28IV%29_%E2%80%93_f_18102020.jpg'], '22222222-2222-2222-2222-222222222222', 'owner_delivers', 'listed', 2, 5.0, NOW() - INTERVAL '5 days'),

-- Roberto's Cars (2 cars - Luxury)
('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005', 'BMW', '3 Series', 2021, 'Black', 'STU-6789', 'VIN001234567890007', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'automatic', 'petrol', 5, 5500.00, 'Luxury BMW 3 Series for those special occasions. Premium comfort and performance.', ARRAY['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Premium Sound'], 'Professional drivers only. No smoking. Age 25+.', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', 'https://images.unsplash.com/photo-1617531653520-bd99c51c3c59?w=800'], '22222222-2222-2222-2222-222222222222', 'warehouse', 'listed', 4, 4.9, NOW() - INTERVAL '5 days'),
('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000005', 'Mercedes-Benz', 'C-Class', 2022, 'Silver', 'VWX-0123', 'VIN001234567890008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'automatic', 'petrol', 5, 6000.00, 'Brand new Mercedes-Benz C-Class. Ultimate luxury and elegance.', ARRAY['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Premium Sound', 'Heated Seats'], 'Age 25+. Clean driving record required.', ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'], '22222222-2222-2222-2222-222222222222', 'warehouse', 'listed', 2, 5.0, NOW() - INTERVAL '5 days'),

-- Lisa's Car (1 car)
('60000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000006', 'Toyota', 'Wigo', 2020, 'Yellow', 'YZA-4567', 'VIN001234567890009', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'manual', 'petrol', 4, 1200.00, 'Fun and affordable Toyota Wigo. Perfect for solo travelers and couples.', ARRAY['Air Conditioning', 'USB Port'], 'Must know manual transmission. No smoking.', ARRAY['https://online.toyota.com.ph/medias/B100LAGQSFF007-B100LAGQSFF007-1G3-515151-002-497-1595210286453-000.jpg-1659662351973-TMP-2890Wx1690H?context=bWFzdGVyfHJvb3R8NDk2MTEyfGltYWdlL2pwZWd8YUdFNUwyaGtZaTg0T1RjMU16QTRPVEUwTnpFNEwwSXhNREJNUVVkUlUwWkdNREEzWDBJeE1EQk1RVWRSVTBaR01EQTNYekZITXkwak5URTFNVFV4WHpBd01sODBPVGRmTVRVNU5USXhNREk0TmpRMU0xOHdNREF1YW5Cblh6RTJOVGsyTmpJek5URTVOek5mVkUxUUxUSTRPVEJYZURFMk9UQkl8YTVkNmIyNzk4NzgzZjk3MGIxNzlmYzI0YjUzNzA1NDcwMmE5YzBjOTBhYjBjYWRjMmMyY2I0ODJkYmJjYjcxNQ'], '44444444-4444-4444-4444-444444444444', 'owner_delivers', 'listed', 1, 4.5, NOW() - INTERVAL '4 days'),

-- Michael's Cars (2 cars - pending/newly listed)
('60000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000007', 'Nissan', 'Navara', 2021, 'Gray', 'BCD-8901', 'VIN001234567890010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'automatic', 'diesel', 5, 3000.00, 'Rugged Nissan Navara pickup truck. Great for moving cargo or outdoor adventures.', ARRAY['4WD', 'Bluetooth', 'Towing Capacity'], 'No off-roading without permission. Return clean.', ARRAY['https://images.unsplash.com/photo-1587724107506-f49c4506f630?w=800'], '33333333-3333-3333-3333-333333333333', 'warehouse', 'pending_approval', 0, 0.0, NOW() - INTERVAL '2 days'),
('60000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000007', 'Hyundai', 'Starex', 2020, 'White', 'EFG-2345', 'VIN001234567890011', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'automatic', 'diesel', 12, 3500.00, 'Spacious Hyundai Starex van perfect for group trips and events.', ARRAY['Air Conditioning', 'Bluetooth', 'Luggage Space'], 'No smoking. Maximum 12 passengers.', ARRAY['https://images.unsplash.com/photo-1624646983307-0f4a1c2d95e2?w=800'], '33333333-3333-3333-3333-333333333333', 'warehouse', 'pending_approval', 0, 0.0, NOW() - INTERVAL '2 days');

-- ============================================
-- 7. CONTRACT APPOINTMENTS
-- ============================================

INSERT INTO contract_appointments (id, car_id, owner_id, branch_id, scheduled_date, scheduled_time, status, completed_at, completed_by, admin_notes, created_at) VALUES
-- Completed contracts
('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', '10:00:00', 'completed', NOW() - INTERVAL '7 days', '00000000-0000-0000-0000-000000000001', 'All documents verified. Vehicle approved.', NOW() - INTERVAL '8 days'),
('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', '11:00:00', 'completed', NOW() - INTERVAL '7 days', '00000000-0000-0000-0000-000000000001', 'Second car from same owner. Quick approval.', NOW() - INTERVAL '8 days'),

-- Scheduled contracts
('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', CURRENT_DATE + INTERVAL '2 days', '14:00:00', 'scheduled', NULL, NULL, 'Pending vehicle inspection and document review.', NOW() - INTERVAL '2 days'),
('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', CURRENT_DATE + INTERVAL '2 days', '15:00:00', 'scheduled', NULL, NULL, 'New owner onboarding.', NOW() - INTERVAL '2 days');

-- ============================================
-- 8. CAR AVAILABILITY (Blocked dates)
-- ============================================

INSERT INTO car_availability (car_id, blocked_from, blocked_until, reason, created_at) VALUES
('60000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '12 days', 'Scheduled maintenance', NOW() - INTERVAL '3 days'),
('60000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '20 days', 'Personal family trip', NOW() - INTERVAL '2 days'),
('60000000-0000-0000-0000-000000000007', CURRENT_DATE + INTERVAL '8 days', CURRENT_DATE + INTERVAL '9 days', 'Oil change and inspection', NOW() - INTERVAL '1 day');

-- ============================================
-- 9. BOOKINGS (Various statuses)
-- ============================================

INSERT INTO bookings (id, booking_reference, customer_id, car_id, owner_id, pickup_date, return_date, total_days, branch_id, daily_rate, subtotal, platform_fee, total_amount, payment_plan, status, owner_dropoff_at, customer_pickup_at, customer_notes, created_at) VALUES
-- Completed bookings
('80000000-0000-0000-0000-000000000001', 'RE-20251020-ABC123', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '5 days', 3, '11111111-1111-1111-1111-111111111111', 1500.00, 4500.00, 450.00, 4950.00, 'downpayment', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour', 'Need car for business meetings', NOW() - INTERVAL '8 days'),
('80000000-0000-0000-0000-000000000002', 'RE-20251021-DEF456', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '3 days', 4, '22222222-2222-2222-2222-222222222222', 3500.00, 14000.00, 1400.00, 15400.00, 'installment', 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '2 hours', 'Family trip to Tagaytay', NOW() - INTERVAL '7 days'),

-- Active bookings
('80000000-0000-0000-0000-000000000003', 'RE-20251025-GHI789', '20000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day', 4, '11111111-1111-1111-1111-111111111111', 1600.00, 6400.00, 640.00, 7040.00, 'downpayment', 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 'Weekend getaway', NOW() - INTERVAL '4 days'),
('80000000-0000-0000-0000-000000000004', 'RE-20251026-JKL012', '20000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 4, '33333333-3333-3333-3333-333333333333', 1800.00, 7200.00, 720.00, 7920.00, 'downpayment', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour', NULL, NOW() - INTERVAL '3 days'),

-- Confirmed upcoming bookings
('80000000-0000-0000-0000-000000000005', 'RE-20251028-MNO345', '20000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 4, '22222222-2222-2222-2222-222222222222', 4000.00, 16000.00, 1600.00, 17600.00, 'installment', 'confirmed', NULL, NULL, 'Anniversary trip to Baguio', NOW() - INTERVAL '2 days'),
('80000000-0000-0000-0000-000000000006', 'RE-20251029-PQR678', '20000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 2, '22222222-2222-2222-2222-222222222222', 5500.00, 11000.00, 1100.00, 12100.00, 'downpayment', 'confirmed', NULL, NULL, 'Corporate event', NOW() - INTERVAL '1 day'),

-- Pending bookings
('80000000-0000-0000-0000-000000000007', 'RE-20251030-STU901', '20000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 3, '22222222-2222-2222-2222-222222222222', 1400.00, 4200.00, 420.00, 4620.00, 'downpayment', 'pending_payment', NULL, NULL, 'City errands', NOW() - INTERVAL '1 hour'),

-- Cancelled booking
('80000000-0000-0000-0000-000000000008', 'RE-20251024-VWX234', '20000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000005', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 3, '22222222-2222-2222-2222-222222222222', 6000.00, 18000.00, 1800.00, 19800.00, 'downpayment', 'cancelled_with_refund', NULL, NULL, NULL, NOW() - INTERVAL '2 days'),

-- ============================================
-- LIFECYCLE TEST BOOKINGS (for automated transitions)
-- ============================================

-- Test 1: Confirmed booking with pickup TODAY (should auto-transition to active)
('80000000-0000-0000-0000-000000000009', 'RE-LIFECYCLE-001', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000006', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 3, '11111111-1111-1111-1111-111111111111', 1200.00, 3600.00, 360.00, 3960.00, 'downpayment', 'confirmed', NULL, NULL, 'Test: Ready to go active', NOW() - INTERVAL '1 day'),

-- Test 2: Confirmed booking with pickup date in the PAST (should auto-transition immediately)
('80000000-0000-0000-0000-00000000000a', 'RE-LIFECYCLE-002', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 3, '11111111-1111-1111-1111-111111111111', 1500.00, 4500.00, 450.00, 4950.00, 'downpayment', 'confirmed', NULL, NULL, 'Test: Pickup date passed', NOW() - INTERVAL '2 days'),

-- Test 3: Active booking with return date TODAY (should auto-transition to returned)
('80000000-0000-0000-0000-00000000000b', 'RE-LIFECYCLE-003', '20000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-00000000000b', '50000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE, 2, '22222222-2222-2222-2222-222222222222', 1800.00, 3600.00, 360.00, 3960.00, 'downpayment', 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 'Test: Due for return today', NOW() - INTERVAL '3 days'),

-- Test 4: Active booking 3 DAYS OVERDUE (should trigger late fee calculation)
('80000000-0000-0000-0000-00000000000c', 'RE-LIFECYCLE-004', '20000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-00000000000c', '50000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', 2, '33333333-3333-3333-3333-333333333333', 2000.00, 4000.00, 400.00, 4400.00, 'downpayment', 'active', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes', 'Test: 3 days overdue', NOW() - INTERVAL '6 days'),

-- Test 5: Active booking 1 DAY OVERDUE (should trigger late fee for 1 day)
('80000000-0000-0000-0000-00000000000d', 'RE-LIFECYCLE-005', '20000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-00000000000d', '50000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day', 2, '11111111-1111-1111-1111-111111111111', 2500.00, 5000.00, 500.00, 5500.00, 'downpayment', 'active', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour', 'Test: 1 day overdue', NOW() - INTERVAL '4 days'),

-- Test 6: Pending owner confirmation (should remain in this state)
('80000000-0000-0000-0000-00000000000e', 'RE-LIFECYCLE-006', '20000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 2, '22222222-2222-2222-2222-222222222222', 1400.00, 2800.00, 280.00, 3080.00, 'downpayment', 'pending_owner_confirmation', NULL, NULL, 'Test: Awaiting owner confirmation', NOW() - INTERVAL '3 hours'),

-- ============================================
-- MANUAL TESTING BOOKINGS (for owner controls)
-- ============================================

-- Test 7: CONFIRMED booking - Test "Mark as Picked Up" button
('80000000-0000-0000-0000-00000000000f', 'RE-MANUAL-001', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 2, '11111111-1111-1111-1111-111111111111', 1500.00, 3000.00, 300.00, 3300.00, 'downpayment', 'confirmed', NULL, NULL, 'Test Manual: Click Mark as Picked Up', NOW() - INTERVAL '1 hour'),

-- Test 8: ACTIVE booking - Test "Mark as Returned" button
('80000000-0000-0000-0000-000000000010', 'RE-MANUAL-002', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', 2, '11111111-1111-1111-1111-111111111111', 1600.00, 3200.00, 320.00, 3520.00, 'downpayment', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', 'Test Manual: Click Mark as Returned', NOW() - INTERVAL '2 hours'),

-- Test 9: RETURNED booking - Test "Complete Booking" button
('80000000-0000-0000-0000-000000000011', 'RE-MANUAL-003', '20000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 hour', 2, '22222222-2222-2222-2222-222222222222', 3500.00, 7000.00, 700.00, 7700.00, 'downpayment', 'returned', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 'Test Manual: Click Complete Booking', NOW() - INTERVAL '3 hours');

-- Update booking references manually to avoid trigger issues
UPDATE bookings SET booking_reference = 'RE-20251020-ABC123' WHERE id = '80000000-0000-0000-0000-000000000001';
UPDATE bookings SET booking_reference = 'RE-20251021-DEF456' WHERE id = '80000000-0000-0000-0000-000000000002';
UPDATE bookings SET booking_reference = 'RE-20251025-GHI789' WHERE id = '80000000-0000-0000-0000-000000000003';
UPDATE bookings SET booking_reference = 'RE-20251026-JKL012' WHERE id = '80000000-0000-0000-0000-000000000004';
UPDATE bookings SET booking_reference = 'RE-20251028-MNO345' WHERE id = '80000000-0000-0000-0000-000000000005';
UPDATE bookings SET booking_reference = 'RE-20251029-PQR678' WHERE id = '80000000-0000-0000-0000-000000000006';
UPDATE bookings SET booking_reference = 'RE-20251030-STU901' WHERE id = '80000000-0000-0000-0000-000000000007';
UPDATE bookings SET booking_reference = 'RE-20251024-VWX234' WHERE id = '80000000-0000-0000-0000-000000000008';
UPDATE bookings SET booking_reference = 'RE-LIFECYCLE-001' WHERE id = '80000000-0000-0000-0000-000000000009';
UPDATE bookings SET booking_reference = 'RE-LIFECYCLE-002' WHERE id = '80000000-0000-0000-0000-00000000000a';
UPDATE bookings SET booking_reference = 'RE-LIFECYCLE-003' WHERE id = '80000000-0000-0000-0000-00000000000b';
UPDATE bookings SET booking_reference = 'RE-LIFECYCLE-004' WHERE id = '80000000-0000-0000-0000-00000000000c';
UPDATE bookings SET booking_reference = 'RE-LIFECYCLE-005' WHERE id = '80000000-0000-0000-0000-00000000000d';
UPDATE bookings SET booking_reference = 'RE-LIFECYCLE-006' WHERE id = '80000000-0000-0000-0000-00000000000e';
UPDATE bookings SET booking_reference = 'RE-MANUAL-001' WHERE id = '80000000-0000-0000-0000-00000000000f';
UPDATE bookings SET booking_reference = 'RE-MANUAL-002' WHERE id = '80000000-0000-0000-0000-000000000010';
UPDATE bookings SET booking_reference = 'RE-MANUAL-003' WHERE id = '80000000-0000-0000-0000-000000000011';

-- ============================================
-- 10. PAYMENTS
-- ============================================

INSERT INTO payments (id, booking_id, amount, payment_method, payment_plan, installment_number, is_initial_payment, card_last4, card_brand, transaction_id, status, processed_at, created_at) VALUES
-- Completed payments
('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 990.00, 'credit_card', 'downpayment', NULL, true, '1234', 'Visa', 'TXN-20251020-001', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 1283.33, 'debit_card', 'installment', 1, true, '5678', 'Mastercard', 'TXN-20251021-002', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 1408.00, 'credit_card', 'downpayment', NULL, true, '9012', 'Visa', 'TXN-20251025-003', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('90000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000004', 1584.00, 'credit_card', 'downpayment', NULL, true, '3456', 'Mastercard', 'TXN-20251026-004', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('90000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000005', 1466.67, 'credit_card', 'installment', 1, true, '7890', 'Visa', 'TXN-20251028-005', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('90000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000006', 2420.00, 'credit_card', 'downpayment', NULL, true, '2345', 'Amex', 'TXN-20251029-006', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Refunded payment
('90000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000008', 3960.00, 'credit_card', 'downpayment', NULL, true, '6789', 'Visa', 'TXN-20251024-007', 'refunded', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Lifecycle test booking payments
('90000000-0000-0000-0000-000000000008', '80000000-0000-0000-0000-000000000009', 792.00, 'credit_card', 'downpayment', NULL, true, '1111', 'Visa', 'TXN-LIFECYCLE-001', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('90000000-0000-0000-0000-000000000009', '80000000-0000-0000-0000-00000000000a', 990.00, 'credit_card', 'downpayment', NULL, true, '2222', 'Mastercard', 'TXN-LIFECYCLE-002', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('90000000-0000-0000-0000-00000000000a', '80000000-0000-0000-0000-00000000000b', 792.00, 'credit_card', 'downpayment', NULL, true, '3333', 'Visa', 'TXN-LIFECYCLE-003', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('90000000-0000-0000-0000-00000000000b', '80000000-0000-0000-0000-00000000000c', 880.00, 'credit_card', 'downpayment', NULL, true, '4444', 'Amex', 'TXN-LIFECYCLE-004', 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('90000000-0000-0000-0000-00000000000c', '80000000-0000-0000-0000-00000000000d', 1100.00, 'credit_card', 'downpayment', NULL, true, '5555', 'Visa', 'TXN-LIFECYCLE-005', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('90000000-0000-0000-0000-00000000000d', '80000000-0000-0000-0000-00000000000e', 616.00, 'credit_card', 'downpayment', NULL, true, '6666', 'Mastercard', 'TXN-LIFECYCLE-006', 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

-- Manual test booking payments
('90000000-0000-0000-0000-00000000000e', '80000000-0000-0000-0000-00000000000f', 660.00, 'credit_card', 'downpayment', NULL, true, '7777', 'Visa', 'TXN-MANUAL-001', 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('90000000-0000-0000-0000-00000000000f', '80000000-0000-0000-0000-000000000010', 704.00, 'credit_card', 'downpayment', NULL, true, '8888', 'Mastercard', 'TXN-MANUAL-002', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('90000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000011', 1540.00, 'credit_card', 'downpayment', NULL, true, '9999', 'Visa', 'TXN-MANUAL-003', 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours');

-- Update refund info for cancelled booking
UPDATE payments SET refunded_amount = 19800.00, refunded_at = NOW() - INTERVAL '1 day', refund_reason = 'Booking cancelled by customer' WHERE id = '90000000-0000-0000-0000-000000000007';

-- ============================================
-- 11. OWNER PAYOUTS
-- ============================================

INSERT INTO owner_payouts (id, booking_id, owner_id, rental_amount, platform_fee, warehouse_fee, late_fee_owner_share, damage_deduction, net_payout, payout_method, bank_account, status, paid_at, notes, created_at) VALUES
-- Paid out for completed bookings
('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 4500.00, 450.00, 2000.00, 0.00, 0.00, 2050.00, 'debit_card', '1234567890', 'completed', NOW() - INTERVAL '4 days', 'Warehouse fee deducted. Monthly storage.', NOW() - INTERVAL '5 days'),
('a0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 14000.00, 1400.00, 0.00, 0.00, 0.00, 12600.00, 'credit_card', '2345678901', 'completed', NOW() - INTERVAL '2 days', 'Owner delivery - no warehouse fee.', NOW() - INTERVAL '3 days'),

-- Pending payouts
('a0000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 6400.00, 640.00, 2000.00, 0.00, 0.00, 3760.00, 'debit_card', '1234567890', 'pending', NULL, 'Awaiting booking completion.', NOW() - INTERVAL '1 day');

-- ============================================
-- 12. WAREHOUSE STORAGE
-- ============================================

INSERT INTO warehouse_storage (id, car_id, branch_id, storage_start_date, storage_end_date, monthly_fee, is_active, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', NULL, 2000.00, true, NOW() - INTERVAL '7 days'),
('b0000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', NULL, 2000.00, true, NOW() - INTERVAL '7 days'),
('b0000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '6 days', NULL, 1800.00, true, NOW() - INTERVAL '6 days'),
('b0000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', NULL, 2500.00, true, NOW() - INTERVAL '5 days'),
('b0000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', NULL, 2500.00, true, NOW() - INTERVAL '5 days');

-- ============================================
-- 13. DAMAGES
-- ============================================

INSERT INTO damages (id, booking_id, car_id, reported_by, description, damage_photos, estimated_cost, status, resolution_notes, resolved_at, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Minor scratch on rear bumper. Likely from parking.', ARRAY['/damages/scratch-1.jpg'], 3000.00, 'resolved', 'Renter agreed to cover repair cost. Amount deducted from deposit.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
('c0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Dent on front passenger door.', ARRAY['/damages/dent-1.jpg', '/damages/dent-2.jpg'], 8000.00, 'under_review', NULL, NULL, NOW() - INTERVAL '2 days');

-- ============================================
-- 14. NOTIFICATIONS
-- ============================================

INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, is_read, created_at) VALUES
-- Owner notifications
('10000000-0000-0000-0000-000000000001', 'booking_completed', 'Booking Completed', 'Your Toyota Vios booking has been completed. Payout is being processed.', '80000000-0000-0000-0000-000000000001', 'booking', '/owner/earnings', true, NOW() - INTERVAL '4 days'),
('10000000-0000-0000-0000-000000000001', 'payout_completed', 'Payout Sent', 'PHP 2,050.00 has been sent to your account.', 'a0000000-0000-0000-0000-000000000001', 'payout', '/owner/earnings', true, NOW() - INTERVAL '4 days'),
('10000000-0000-0000-0000-000000000001', 'damage_reported', 'Damage Reported', 'A damage has been reported on your Toyota Vios. Please review.', 'c0000000-0000-0000-0000-000000000001', 'damage', '/owner/cars/60000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000002', 'booking_confirmed', 'New Booking!', 'Your Montero Sport has been booked for Oct 28-31.', '80000000-0000-0000-0000-000000000005', 'booking', '/owner/dashboard', false, NOW() - INTERVAL '2 days'),
('10000000-0000-0000-0000-000000000007', 'contract_scheduled', 'Contract Appointment Scheduled', 'Your contract signing is scheduled for 2 days from now at 2:00 PM.', '70000000-0000-0000-0000-000000000003', 'contract_appointment', '/owner/profile', false, NOW() - INTERVAL '2 days'),

-- Customer notifications
('20000000-0000-0000-0000-000000000001', 'booking_completed', 'Rental Completed', 'Thank you for renting with RentEase! How was your experience?', '80000000-0000-0000-0000-000000000001', 'booking', '/bookings/80000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '4 days'),
('20000000-0000-0000-0000-000000000003', 'booking_active', 'Rental Started', 'Your Honda City rental is now active. Enjoy your trip!', '80000000-0000-0000-0000-000000000003', 'booking', '/bookings/80000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '2 days'),
('20000000-0000-0000-0000-000000000004', 'booking_active', 'Rental Active', 'Your Mazda 3 is ready for pickup. Safe travels!', '80000000-0000-0000-0000-000000000004', 'booking', '/bookings/80000000-0000-0000-0000-000000000004', false, NOW() - INTERVAL '1 day'),
('20000000-0000-0000-0000-000000000005', 'booking_confirmed', 'Booking Confirmed!', 'Your Toyota Fortuner booking is confirmed for Oct 29 - Nov 1.', '80000000-0000-0000-0000-000000000005', 'booking', '/bookings/80000000-0000-0000-0000-000000000005', false, NOW() - INTERVAL '2 days'),
('20000000-0000-0000-0000-000000000007', 'payment_pending', 'Complete Your Payment', 'Your booking is reserved. Please complete payment within 24 hours.', '80000000-0000-0000-0000-000000000007', 'booking', '/bookings/80000000-0000-0000-0000-000000000007/payment', false, NOW() - INTERVAL '1 hour'),
('20000000-0000-0000-0000-000000000008', 'refund_processed', 'Refund Processed', 'Your refund of PHP 19,800.00 has been processed to your card ending in 6789.', '80000000-0000-0000-0000-000000000008', 'booking', '/bookings', false, NOW() - INTERVAL '1 day');

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '    RENTEASE MARKETPLACE - DATABASE READY!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Comprehensive Sample Data Loaded:';
    RAISE NOTICE '  - 1 Admin User';
    RAISE NOTICE '  - 7 Car Owners (6 verified, 1 pending)';
    RAISE NOTICE '  - 10 Customers';
    RAISE NOTICE '  - 4 Branches (Manila, Makati, QC, Pasig)';
    RAISE NOTICE '  - 5 Vehicle Categories';
    RAISE NOTICE '  - 11 Cars (9 listed, 2 pending approval)';
    RAISE NOTICE '  - 8 Bookings (2 completed, 2 active, 3 confirmed, 1 cancelled)';
    RAISE NOTICE '  - 7 Payments';
    RAISE NOTICE '  - 3 Owner Payouts';
    RAISE NOTICE '  - 2 Damage Reports';
    RAISE NOTICE '  - 12 Notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'Login Credentials (all users):';
    RAISE NOTICE '  - Email: See sample data above';
    RAISE NOTICE '  - Password: password123';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Login:';
    RAISE NOTICE '  - Email: admin@rentease.ph';
    RAISE NOTICE '  - Password: password123';
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
END $$;
