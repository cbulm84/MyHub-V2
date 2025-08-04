-- Fix infinite recursion in employees RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "HR and ADMIN can view all employees" ON employees;
DROP POLICY IF EXISTS "HR and ADMIN can update employees" ON employees;
DROP POLICY IF EXISTS "HR and ADMIN can insert employees" ON employees;

-- Create fixed policies that avoid recursion by using auth.jwt() to get user role

-- First, let's create a simpler policy for HR and ADMIN to view all employees
CREATE POLICY "HR and ADMIN can view all employees" ON employees
  FOR SELECT USING (
    -- Check if the current user is HR or ADMIN by looking at their own record first
    auth.uid() IN (
      SELECT auth_user_id 
      FROM employees e
      INNER JOIN user_types ut ON e.user_type_id = ut.user_type_id
      WHERE ut.name IN ('HR', 'ADMIN')
    )
  );

-- HR and ADMIN can update employees
CREATE POLICY "HR and ADMIN can update employees" ON employees
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT auth_user_id 
      FROM employees e
      INNER JOIN user_types ut ON e.user_type_id = ut.user_type_id
      WHERE ut.name IN ('HR', 'ADMIN')
    )
  );

-- HR and ADMIN can insert employees
CREATE POLICY "HR and ADMIN can insert employees" ON employees
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id 
      FROM employees e
      INNER JOIN user_types ut ON e.user_type_id = ut.user_type_id
      WHERE ut.name IN ('HR', 'ADMIN')
    )
  );

-- Alternative approach: Create a function to check if user is admin/HR
CREATE OR REPLACE FUNCTION is_admin_or_hr()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM employees e
    INNER JOIN user_types ut ON e.user_type_id = ut.user_type_id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name IN ('HR', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;