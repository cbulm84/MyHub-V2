-- Fix RLS policies for employees table
-- This migration adds proper policies for authenticated users to interact with employee data

-- Drop existing policy to recreate with better permissions
DROP POLICY IF EXISTS "Allow authenticated read" ON employees;

-- Create comprehensive RLS policies for employees table

-- 1. Allow all authenticated users to view all employees
CREATE POLICY "Authenticated users can view all employees" 
ON employees FOR SELECT 
USING (auth.role() = 'authenticated');

-- 2. Allow users to update their own employee record
CREATE POLICY "Users can update own employee record" 
ON employees FOR UPDATE 
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- 3. Allow ADMIN and HR users to manage all employees
-- First, we need to create a function to check user type
CREATE OR REPLACE FUNCTION auth.user_has_role(allowed_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.user_type_id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin/HR can insert new employees
CREATE POLICY "Admin and HR can insert employees" 
ON employees FOR INSERT 
WITH CHECK (auth.user_has_role(ARRAY['ADMIN', 'HR']));

-- Admin/HR can update any employee
CREATE POLICY "Admin and HR can update any employee" 
ON employees FOR UPDATE 
USING (auth.user_has_role(ARRAY['ADMIN', 'HR']))
WITH CHECK (auth.user_has_role(ARRAY['ADMIN', 'HR']));

-- Admin/HR can delete (soft delete) employees
CREATE POLICY "Admin and HR can delete employees" 
ON employees FOR DELETE 
USING (auth.user_has_role(ARRAY['ADMIN', 'HR']));

-- Fix RLS policies for related tables that might be causing issues

-- User types table - all authenticated users can read
CREATE POLICY "Authenticated users can view user types" 
ON user_types FOR SELECT 
USING (auth.role() = 'authenticated');

-- Employee assignments - authenticated users can view all
CREATE POLICY "Authenticated users can view assignments" 
ON employee_assignments FOR SELECT 
USING (auth.role() = 'authenticated');

-- Admin/HR can manage assignments
CREATE POLICY "Admin and HR can insert assignments" 
ON employee_assignments FOR INSERT 
WITH CHECK (auth.user_has_role(ARRAY['ADMIN', 'HR']));

CREATE POLICY "Admin and HR can update assignments" 
ON employee_assignments FOR UPDATE 
USING (auth.user_has_role(ARRAY['ADMIN', 'HR']))
WITH CHECK (auth.user_has_role(ARRAY['ADMIN', 'HR']));

-- Locations - all authenticated users can view
CREATE POLICY "Authenticated users can view locations" 
ON locations FOR SELECT 
USING (auth.role() = 'authenticated');

-- Admin/HR can manage locations
CREATE POLICY "Admin and HR can insert locations" 
ON locations FOR INSERT 
WITH CHECK (auth.user_has_role(ARRAY['ADMIN', 'HR']));

CREATE POLICY "Admin and HR can update locations" 
ON locations FOR UPDATE 
USING (auth.user_has_role(ARRAY['ADMIN', 'HR']))
WITH CHECK (auth.user_has_role(ARRAY['ADMIN', 'HR']));

-- Job titles - all authenticated users can view
CREATE POLICY "Authenticated users can view job titles" 
ON job_titles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Districts, regions, markets - all authenticated users can view
CREATE POLICY "Authenticated users can view districts" 
ON districts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view regions" 
ON regions FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view markets" 
ON markets FOR SELECT 
USING (auth.role() = 'authenticated');

-- Enable RLS on tables that don't have it yet but should
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;