-- Row Level Security Policies for TransitOps
-- Apply this AFTER the main schema.sql

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Fleet managers can manage users" ON users;
CREATE POLICY "Fleet managers can manage users" ON users
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

-- Vehicles table policies
DROP POLICY IF EXISTS "All authenticated users can view vehicles" ON vehicles;
CREATE POLICY "All authenticated users can view vehicles" ON vehicles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage vehicles" ON vehicles;
CREATE POLICY "Fleet managers can manage vehicles" ON vehicles
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Safety officers can update vehicles" ON vehicles;
CREATE POLICY "Safety officers can update vehicles" ON vehicles
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'Safety Officer');

-- Drivers table policies
DROP POLICY IF EXISTS "All authenticated users can view drivers" ON drivers;
CREATE POLICY "All authenticated users can view drivers" ON drivers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage drivers" ON drivers;
CREATE POLICY "Fleet managers can manage drivers" ON drivers
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Safety officers can update drivers" ON drivers;
CREATE POLICY "Safety officers can update drivers" ON drivers
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'Safety Officer');

-- Trips table policies
DROP POLICY IF EXISTS "All authenticated users can view trips" ON trips;
CREATE POLICY "All authenticated users can view trips" ON trips
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage trips" ON trips;
CREATE POLICY "Fleet managers can manage trips" ON trips
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can update assigned trips" ON trips;
CREATE POLICY "Drivers can update assigned trips" ON trips
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'Driver' AND
    driver_id = (SELECT id FROM drivers WHERE license_number = (SELECT license_number FROM drivers WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Financial analysts can update trip revenue" ON trips;
CREATE POLICY "Financial analysts can update trip revenue" ON trips
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'Financial Analyst');

-- Maintenance logs policies
DROP POLICY IF EXISTS "All authenticated users can view maintenance" ON maintenance_logs;
CREATE POLICY "All authenticated users can view maintenance" ON maintenance_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage maintenance" ON maintenance_logs;
CREATE POLICY "Fleet managers can manage maintenance" ON maintenance_logs
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can create maintenance reports" ON maintenance_logs;
CREATE POLICY "Drivers can create maintenance reports" ON maintenance_logs
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'Driver');

-- Fuel logs policies
DROP POLICY IF EXISTS "All authenticated users can view fuel logs" ON fuel_logs;
CREATE POLICY "All authenticated users can view fuel logs" ON fuel_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage fuel logs" ON fuel_logs;
CREATE POLICY "Fleet managers can manage fuel logs" ON fuel_logs
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can create fuel logs" ON fuel_logs;
CREATE POLICY "Drivers can create fuel logs" ON fuel_logs
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'Driver');

-- Expenses policies
DROP POLICY IF EXISTS "All authenticated users can view expenses" ON expenses;
CREATE POLICY "All authenticated users can view expenses" ON expenses
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage expenses" ON expenses;
CREATE POLICY "Fleet managers can manage expenses" ON expenses
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers can create expenses" ON expenses;
CREATE POLICY "Drivers can create expenses" ON expenses
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'Driver');

DROP POLICY IF EXISTS "Financial analysts can update expenses" ON expenses;
CREATE POLICY "Financial analysts can update expenses" ON expenses
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'Financial Analyst');

-- Documents policies
DROP POLICY IF EXISTS "Users can view relevant documents" ON documents;
CREATE POLICY "Users can view relevant documents" ON documents
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Fleet managers can manage all documents" ON documents;
CREATE POLICY "Fleet managers can manage all documents" ON documents
  FOR ALL
  USING (get_user_role(auth.uid()) = 'Fleet Manager');

DROP POLICY IF EXISTS "Drivers and safety officers can create documents" ON documents;
CREATE POLICY "Drivers and safety officers can create documents" ON documents
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('Driver', 'Safety Officer')
  );

-- Create an admin user function (to be called manually after auth setup)
CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email TEXT,
  admin_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- This function should be called after the admin user is created via Supabase Auth
  -- It adds the user to the users table with Fleet Manager role

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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;