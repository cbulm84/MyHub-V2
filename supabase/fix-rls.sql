-- Temporary fix: simplify employee access policies

-- Since we already have "Allow authenticated read" policy, 
-- let's just rely on that for now and fix the admin policies later

-- The existing policies are:
-- 1. "Allow authenticated read" - allows any authenticated user to read
-- 2. "Employees can view own record" - allows users to view their own record
-- 3. "HR and ADMIN can view all employees" - THIS IS CAUSING RECURSION

-- For now, the "Allow authenticated read" policy is sufficient
-- We can add more restrictive policies later