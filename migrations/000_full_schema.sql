-- TransitOps — Consolidated Schema Migration
-- Run this as a single migration in Supabase SQL Editor
-- Combines: schema.sql + rls-policies.sql + storage-setup.sql + migrations/001_add_indexes.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    type TEXT NOT NULL,
    make TEXT DEFAULT '',
    year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    region TEXT DEFAULT '',
    max_load_capacity DECIMAL(10,2) NOT NULL,
    odometer INTEGER NOT NULL DEFAULT 0,
    acquisition_cost DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
    last_service_date DATE,
    fuel_type TEXT DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'petrol', 'electric', 'cng')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    license_category TEXT NOT NULL DEFAULT 'B',
    license_expiry DATE NOT NULL,
    contact TEXT NOT NULL,
    email TEXT DEFAULT '',
    region TEXT DEFAULT '',
    safety_score INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    join_date DATE DEFAULT CURRENT_DATE,
    total_trips INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_number TEXT UNIQUE,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    cargo_description TEXT DEFAULT '',
    cargo_weight DECIMAL(10,2) NOT NULL,
    planned_distance DECIMAL(10,2) NOT NULL,
    scheduled_departure TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    scheduled_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    fuel_used_liters DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'In Transit', 'Completed', 'Cancelled')),
    revenue DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'corrective' CHECK (type IN ('preventive', 'corrective', 'emergency', 'inspection')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cost DECIMAL(12,2) NOT NULL,
    state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'closed')),
    completed_date DATE,
    mechanic TEXT DEFAULT '',
    parts_replaced TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel Logs
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(10,2) NOT NULL,
    cost_per_liter DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(12,2) NOT NULL,
    odometer_reading INTEGER DEFAULT 0,
    station TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT 'other' CHECK (category IN ('toll', 'insurance', 'repair', 'fine', 'parking', 'other')),
    cost DECIMAL(12,2) NOT NULL,
    description TEXT DEFAULT '',
    receipt_url TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_type TEXT NOT NULL CHECK (reference_type IN ('vehicle', 'driver')),
    reference_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    document_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_region ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_region ON drivers(region);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_state ON maintenance_logs(state);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON maintenance_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_documents_reference_type ON documents(reference_type);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_status ON trips(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON trips(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_date ON expenses(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_state ON maintenance_logs(vehicle_id, state);

-- Trip code unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_trip_number ON trips(trip_number) WHERE trip_number IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS — updated_at
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicles_updated_at') THEN
        CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_drivers_updated_at') THEN
        CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_trips_updated_at') THEN
        CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_maintenance_updated_at') THEN
        CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fuel_updated_at') THEN
        CREATE TRIGGER update_fuel_updated_at BEFORE UPDATE ON fuel_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_expenses_updated_at') THEN
        CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at') THEN
        CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS — Maintenance → Vehicle status
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_vehicle_in_shop()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicles
    SET status = 'In Shop'
    WHERE id = NEW.vehicle_id
    AND status != 'Retired';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenance_created_set_in_shop ON maintenance_logs;
CREATE TRIGGER maintenance_created_set_in_shop
    AFTER INSERT ON maintenance_logs
    FOR EACH ROW
    WHEN (NEW.state = 'open')
    EXECUTE FUNCTION set_vehicle_in_shop();

CREATE OR REPLACE FUNCTION restore_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM maintenance_logs
        WHERE vehicle_id = NEW.vehicle_id
        AND state = 'open'
        AND id != NEW.id
    ) THEN
        UPDATE vehicles
        SET status = 'Available'
        WHERE id = NEW.vehicle_id
        AND status = 'In Shop';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenance_closed_restore_status ON maintenance_logs;
CREATE TRIGGER maintenance_closed_restore_status
    AFTER UPDATE ON maintenance_logs
    FOR EACH ROW
    WHEN (OLD.state = 'open' AND NEW.state = 'closed')
    EXECUTE FUNCTION restore_vehicle_status();

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS — Trip state transitions → Vehicle + Driver status
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trip_dispatched_update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Dispatched' AND OLD.status = 'Draft' THEN
        UPDATE vehicles SET status = 'On Trip' WHERE id = NEW.vehicle_id AND status = 'Available';
        UPDATE drivers SET status = 'On Trip' WHERE id = NEW.driver_id AND status = 'Available';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trip_dispatched_update_vehicle_status ON trips;
CREATE TRIGGER trip_dispatched_update_vehicle_status
    AFTER UPDATE ON trips
    FOR EACH ROW
    WHEN (NEW.status = 'Dispatched' AND OLD.status = 'Draft')
    EXECUTE FUNCTION trip_dispatched_update_vehicle_status();

CREATE OR REPLACE FUNCTION trip_departed_update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'In Transit' AND OLD.status = 'Dispatched' THEN
        UPDATE vehicles SET status = 'On Trip' WHERE id = NEW.vehicle_id;
        UPDATE drivers SET status = 'On Trip' WHERE id = NEW.driver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trip_departed_update_vehicle_status ON trips;
CREATE TRIGGER trip_departed_update_vehicle_status
    AFTER UPDATE ON trips
    FOR EACH ROW
    WHEN (NEW.status = 'In Transit' AND OLD.status = 'Dispatched')
    EXECUTE FUNCTION trip_departed_update_vehicle_status();

CREATE OR REPLACE FUNCTION trip_completed_update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' THEN
        UPDATE vehicles SET status = 'Available' WHERE id = NEW.vehicle_id AND status = 'On Trip';
        UPDATE drivers SET status = 'Available' WHERE id = NEW.driver_id AND status = 'On Trip';
        UPDATE drivers SET total_trips = total_trips + 1 WHERE id = NEW.driver_id;
    ELSIF NEW.status = 'Cancelled' THEN
        UPDATE vehicles SET status = 'Available' WHERE id = NEW.vehicle_id AND status = 'On Trip';
        UPDATE drivers SET status = 'Available' WHERE id = NEW.driver_id AND status = 'On Trip';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trip_completed_update_vehicle_status ON trips;
CREATE TRIGGER trip_completed_update_vehicle_status
    AFTER UPDATE ON trips
    FOR EACH ROW
    WHEN (NEW.status IN ('Completed', 'Cancelled'))
    EXECUTE FUNCTION trip_completed_update_vehicle_status();

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC FUNCTIONS — Trip state machine
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION dispatch_trip(trip_id UUID)
RETURNS VOID AS $$
DECLARE
    trip_record RECORD;
BEGIN
    SELECT * INTO trip_record FROM trips WHERE id = trip_id;

    IF trip_record IS NULL THEN
        RAISE EXCEPTION 'Trip not found';
    END IF;

    IF trip_record.status != 'Draft' THEN
        RAISE EXCEPTION 'Trip must be in Draft status to dispatch';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE id = trip_record.vehicle_id AND status = 'Available') THEN
        RAISE EXCEPTION 'Vehicle is not available';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM drivers WHERE id = trip_record.driver_id AND status = 'Available') THEN
        RAISE EXCEPTION 'Driver is not available';
    END IF;

    UPDATE trips SET status = 'Dispatched', updated_at = NOW() WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION depart_trip(trip_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND status = 'Dispatched') THEN
        RAISE EXCEPTION 'Trip must be in Dispatched status to depart';
    END IF;

    UPDATE trips
    SET status = 'In Transit', actual_departure = NOW(), updated_at = NOW()
    WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_trip(trip_id UUID, p_revenue DECIMAL, p_fuel_used DECIMAL)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND status = 'In Transit') THEN
        RAISE EXCEPTION 'Trip must be in In Transit status to complete';
    END IF;

    UPDATE trips
    SET status = 'Completed',
        revenue = p_revenue,
        fuel_used_liters = p_fuel_used,
        actual_arrival = NOW(),
        updated_at = NOW()
    WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_trip(trip_id UUID)
RETURNS VOID AS $$
DECLARE
    trip_status TEXT;
BEGIN
    SELECT status INTO trip_status FROM trips WHERE id = trip_id;

    IF trip_status IS NULL THEN
        RAISE EXCEPTION 'Trip not found';
    END IF;

    IF trip_status NOT IN ('Draft', 'Dispatched') THEN
        RAISE EXCEPTION 'Only Draft or Dispatched trips can be cancelled';
    END IF;

    UPDATE trips SET status = 'Cancelled', updated_at = NOW() WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS — Enable on all tables
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS — Helper function
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS — Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Fleet managers can manage users" ON users;
CREATE POLICY "Fleet managers can manage users" ON users
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

-- Vehicles
DROP POLICY IF EXISTS "All authenticated users can view vehicles" ON vehicles;
CREATE POLICY "All authenticated users can view vehicles" ON vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage vehicles" ON vehicles;
CREATE POLICY "Fleet managers can manage vehicles" ON vehicles
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Safety officers can update vehicles" ON vehicles;
CREATE POLICY "Safety officers can update vehicles" ON vehicles
  FOR UPDATE USING (get_user_role(auth.uid()) = 'Safety Officer');

-- Drivers
DROP POLICY IF EXISTS "All authenticated users can view drivers" ON drivers;
CREATE POLICY "All authenticated users can view drivers" ON drivers
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage drivers" ON drivers;
CREATE POLICY "Fleet managers can manage drivers" ON drivers
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Safety officers can update drivers" ON drivers;
CREATE POLICY "Safety officers can update drivers" ON drivers
  FOR UPDATE USING (get_user_role(auth.uid()) = 'Safety Officer');

-- Trips
DROP POLICY IF EXISTS "All authenticated users can view trips" ON trips;
CREATE POLICY "All authenticated users can view trips" ON trips
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage trips" ON trips;
CREATE POLICY "Fleet managers can manage trips" ON trips
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can update assigned trips" ON trips;
CREATE POLICY "Drivers can update assigned trips" ON trips
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'Driver' AND
    driver_id = (SELECT id FROM drivers WHERE license_number = (SELECT license_number FROM drivers WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Financial analysts can update trip revenue" ON trips;
CREATE POLICY "Financial analysts can update trip revenue" ON trips
  FOR UPDATE USING (get_user_role(auth.uid()) = 'Financial Analyst');

-- Maintenance Logs
DROP POLICY IF EXISTS "All authenticated users can view maintenance" ON maintenance_logs;
CREATE POLICY "All authenticated users can view maintenance" ON maintenance_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage maintenance" ON maintenance_logs;
CREATE POLICY "Fleet managers can manage maintenance" ON maintenance_logs
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can create maintenance reports" ON maintenance_logs;
CREATE POLICY "Drivers can create maintenance reports" ON maintenance_logs
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'Driver');

-- Fuel Logs
DROP POLICY IF EXISTS "All authenticated users can view fuel logs" ON fuel_logs;
CREATE POLICY "All authenticated users can view fuel logs" ON fuel_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage fuel logs" ON fuel_logs;
CREATE POLICY "Fleet managers can manage fuel logs" ON fuel_logs
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can create fuel logs" ON fuel_logs;
CREATE POLICY "Drivers can create fuel logs" ON fuel_logs
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'Driver');

-- Expenses
DROP POLICY IF EXISTS "All authenticated users can view expenses" ON expenses;
CREATE POLICY "All authenticated users can view expenses" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage expenses" ON expenses;
CREATE POLICY "Fleet managers can manage expenses" ON expenses
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can create expenses" ON expenses;
CREATE POLICY "Drivers can create expenses" ON expenses
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'Driver');

DROP POLICY IF EXISTS "Financial analysts can update expenses" ON expenses;
CREATE POLICY "Financial analysts can update expenses" ON expenses
  FOR UPDATE USING (get_user_role(auth.uid()) = 'Financial Analyst');

-- Documents
DROP POLICY IF EXISTS "Users can view relevant documents" ON documents;
CREATE POLICY "Users can view relevant documents" ON documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage all documents" ON documents;
CREATE POLICY "Fleet managers can manage all documents" ON documents
  FOR ALL USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers and safety officers can create documents" ON documents;
CREATE POLICY "Drivers and safety officers can create documents" ON documents
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('Driver', 'Safety Officer')
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can delete any document" ON storage.objects;
CREATE POLICY "Fleet managers can delete any document" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND owner = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER — Create admin user (call after Supabase Auth signup)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email TEXT,
  admin_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES (
    (SELECT id FROM auth.users WHERE email = admin_email),
    admin_email,
    admin_name,
    'Fleet Manager'
  )
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
