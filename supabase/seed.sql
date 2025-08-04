-- Seed data for Alliance Mobile Employee Portal
-- This creates initial test data for development

-- =====================================================
-- REFERENCE DATA
-- =====================================================

-- User types
INSERT INTO user_types (user_type_id, name, description, permissions) VALUES
(1, 'ADMIN', 'System Administrator', '{"all": true}'),
(2, 'MANAGER', 'Location Manager', '{"employees": ["read", "update"], "locations": ["read", "update"]}'),
(3, 'EMPLOYEE', 'Regular Employee', '{"self": ["read", "update"]}'),
(4, 'HR', 'Human Resources', '{"employees": ["read", "create", "update"], "locations": ["read"]}'),
(5, 'EXECUTIVE', 'Executive Management', '{"all": ["read"], "reports": true}');

-- Termination reasons
INSERT INTO termination_reasons (termination_reason_id, reason_code, description, reason_type) VALUES
(1, 'VOL_RESIGN', 'Voluntary Resignation', 'VOLUNTARY'),
(2, 'VOL_RETIRE', 'Retirement', 'VOLUNTARY'),
(3, 'INVOL_PERF', 'Performance Issues', 'INVOLUNTARY'),
(4, 'INVOL_CONDUCT', 'Conduct/Policy Violation', 'INVOLUNTARY'),
(5, 'RIF', 'Reduction in Force', 'OTHER'),
(6, 'OTHER', 'Other - See Notes', 'OTHER');

-- Job titles
INSERT INTO job_titles (job_title_id, name, description, department, level) VALUES
(1, 'CEO', 'Chief Executive Officer', 'Executive', 10),
(2, 'Regional Director', 'Regional Director', 'Operations', 8),
(3, 'District Manager', 'District Manager', 'Operations', 7),
(4, 'Store Manager', 'Store Manager', 'Operations', 6),
(5, 'Assistant Manager', 'Assistant Store Manager', 'Operations', 5),
(6, 'Sales Associate', 'Sales Associate', 'Sales', 3),
(7, 'HR Manager', 'Human Resources Manager', 'Human Resources', 6),
(8, 'IT Support', 'IT Support Specialist', 'Technology', 4);

-- =====================================================
-- ORGANIZATIONAL HIERARCHY
-- =====================================================

-- Addresses for locations
INSERT INTO addresses (id, address_type, street_line1, city, state_province, postal_code, phone, phone_type) VALUES
('a1111111-1111-1111-1111-111111111111', 'PHYSICAL', '1000 Alliance Blvd', 'Dallas', 'TX', '75201', '214-555-1000', 'MAIN'),
('a2222222-2222-2222-2222-222222222222', 'PHYSICAL', '2000 Market St', 'Fort Worth', 'TX', '76102', '817-555-2000', 'MAIN'),
('a3333333-3333-3333-3333-333333333333', 'PHYSICAL', '3000 Region Ave', 'Houston', 'TX', '77001', '713-555-3000', 'MAIN'),
('a4444444-4444-4444-4444-444444444444', 'PHYSICAL', '4000 District Dr', 'Austin', 'TX', '78701', '512-555-4000', 'MAIN'),
('a5555555-5555-5555-5555-555555555555', 'PHYSICAL', '100 Main St', 'Dallas', 'TX', '75202', '214-555-0100', 'MAIN'),
('a6666666-6666-6666-6666-666666666666', 'PHYSICAL', '200 Oak Ave', 'Irving', 'TX', '75038', '972-555-0200', 'MAIN'),
('a7777777-7777-7777-7777-777777777777', 'PHYSICAL', '300 Elm St', 'Plano', 'TX', '75074', '469-555-0300', 'MAIN');

-- Markets
INSERT INTO markets (market_id, name, abbreviation, address_id, gl_code) VALUES
(1, 'Texas Market', 'TX', 'a1111111-1111-1111-1111-111111111111', 'GL-MKT-001'),
(2, 'Oklahoma Market', 'OK', NULL, 'GL-MKT-002');

-- Regions
INSERT INTO regions (region_id, market_id, name, address_id, gl_code) VALUES
(1, 1, 'North Texas', 'a2222222-2222-2222-2222-222222222222', 'GL-REG-001'),
(2, 1, 'South Texas', 'a3333333-3333-3333-3333-333333333333', 'GL-REG-002'),
(3, 2, 'Central Oklahoma', NULL, 'GL-REG-003');

-- Districts
INSERT INTO districts (district_id, region_id, name, address_id, gl_code) VALUES
(1, 1, 'Dallas District', 'a4444444-4444-4444-4444-444444444444', 'GL-DST-001'),
(2, 1, 'Fort Worth District', NULL, 'GL-DST-002'),
(3, 2, 'Houston District', NULL, 'GL-DST-003'),
(4, 3, 'OKC District', NULL, 'GL-DST-004');

-- Locations
INSERT INTO locations (location_id, district_id, name, address_id, timezone, store_number, gl_code) VALUES
(101, 1, 'Dallas Downtown', 'a5555555-5555-5555-5555-555555555555', 'America/Chicago', 'S001', 'GL-LOC-001'),
(102, 1, 'Dallas Irving', 'a6666666-6666-6666-6666-666666666666', 'America/Chicago', 'S002', 'GL-LOC-002'),
(103, 1, 'Dallas Plano', 'a7777777-7777-7777-7777-777777777777', 'America/Chicago', 'S003', 'GL-LOC-003'),
(201, 2, 'Fort Worth Central', NULL, 'America/Chicago', 'S004', 'GL-LOC-004'),
(301, 3, 'Houston Galleria', NULL, 'America/Chicago', 'S005', 'GL-LOC-005'),
(401, 4, 'OKC Memorial', NULL, 'America/Chicago', 'S006', 'GL-LOC-006');

-- Location codes
INSERT INTO location_codes (location_id, code_type, code_value, description, is_primary) VALUES
(101, 'DEALER', 'DLR001', 'Primary Dealer Code', true),
(101, 'VENDOR', 'VND001', 'Vendor Code A', true),
(102, 'DEALER', 'DLR002', 'Primary Dealer Code', true),
(103, 'DEALER', 'DLR003', 'Primary Dealer Code', true);

-- Location hours (regular hours for location 101)
INSERT INTO location_hours (location_id, day_of_week, open_time, close_time) VALUES
(101, 1, '09:00', '21:00'), -- Monday
(101, 2, '09:00', '21:00'), -- Tuesday
(101, 3, '09:00', '21:00'), -- Wednesday
(101, 4, '09:00', '21:00'), -- Thursday
(101, 5, '09:00', '22:00'), -- Friday
(101, 6, '10:00', '22:00'), -- Saturday
(101, 0, '11:00', '19:00'); -- Sunday

-- Location hours exception (Christmas)
INSERT INTO location_hours (location_id, exception_date, is_closed, exception_reason) VALUES
(101, '2025-12-25', true, 'Christmas Day');

-- =====================================================
-- EMPLOYEES
-- =====================================================

-- Employee addresses
INSERT INTO addresses (id, address_type, street_line1, city, state_province, postal_code) VALUES
('e1111111-1111-1111-1111-111111111111', 'HOME', '123 Employee St', 'Dallas', 'TX', '75201'),
('e2222222-2222-2222-2222-222222222222', 'HOME', '456 Manager Ave', 'Irving', 'TX', '75038'),
('e3333333-3333-3333-3333-333333333333', 'HOME', '789 Director Blvd', 'Plano', 'TX', '75074');

-- Employees
INSERT INTO employees (
  employee_id, username, email, first_name, last_name, 
  user_type_id, address_id, hire_date, 
  mobile_phone, employee_number
) VALUES
(1001, 'john.smith', 'john.smith@alliancemobile.com', 'John', 'Smith', 
  5, 'e1111111-1111-1111-1111-111111111111', '2020-01-15', 
  '214-555-1001', 'EMP001'),
(1002, 'jane.doe', 'jane.doe@alliancemobile.com', 'Jane', 'Doe', 
  2, 'e2222222-2222-2222-2222-222222222222', '2021-03-20', 
  '972-555-1002', 'EMP002'),
(1003, 'bob.johnson', 'bob.johnson@alliancemobile.com', 'Bob', 'Johnson', 
  2, 'e3333333-3333-3333-3333-333333333333', '2022-06-10', 
  '469-555-1003', 'EMP003'),
(1004, 'alice.williams', 'alice.williams@alliancemobile.com', 'Alice', 'Williams', 
  3, NULL, '2023-01-05', 
  '214-555-1004', 'EMP004'),
(1005, 'charlie.brown', 'charlie.brown@alliancemobile.com', 'Charlie', 'Brown', 
  3, NULL, '2023-08-15', 
  '972-555-1005', 'EMP005'),
(1006, 'diana.garcia', 'diana.garcia@alliancemobile.com', 'Diana', 'Garcia', 
  4, NULL, '2021-11-01', 
  '817-555-1006', 'EMP006');

-- Update hierarchy with managers
UPDATE markets SET manager_employee_id = 1001 WHERE market_id = 1;
UPDATE regions SET director_employee_id = 1001 WHERE region_id = 1;
UPDATE districts SET manager_employee_id = 1001 WHERE district_id = 1;
UPDATE locations SET manager_employee_id = 1002 WHERE location_id = 101;
UPDATE locations SET manager_employee_id = 1003 WHERE location_id = 102;

-- Employee assignments
INSERT INTO employee_assignments (
  employee_id, location_id, job_title_id, supervisor_employee_id,
  assignment_type, start_date, is_primary
) VALUES
-- John Smith - CEO
(1001, 101, 1, NULL, 'PRIMARY', '2020-01-15', true),
-- Jane Doe - Store Manager at Dallas Downtown
(1002, 101, 4, 1001, 'PRIMARY', '2021-03-20', true),
-- Bob Johnson - Store Manager at Dallas Irving
(1003, 102, 4, 1001, 'PRIMARY', '2022-06-10', true),
-- Alice Williams - Sales Associate at Dallas Downtown
(1004, 101, 6, 1002, 'PRIMARY', '2023-01-05', true),
-- Charlie Brown - Sales Associate at Dallas Irving (primary) and floater
(1005, 102, 6, 1003, 'PRIMARY', '2023-08-15', true),
(1005, 101, 6, 1002, 'SECONDARY', '2024-01-01', false),
-- Diana Garcia - HR Manager (floats between locations)
(1006, 101, 7, 1001, 'PRIMARY', '2021-11-01', true),
(1006, 102, 7, 1001, 'SECONDARY', '2021-11-01', false),
(1006, 103, 7, 1001, 'SECONDARY', '2021-11-01', false);

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- This query shows the current state
SELECT 'Active Employees' as check_type, COUNT(*) as count FROM employees WHERE is_active = true
UNION ALL
SELECT 'Active Locations', COUNT(*) FROM locations WHERE is_active = true
UNION ALL
SELECT 'Current Assignments', COUNT(*) FROM employee_assignments WHERE is_current = true
UNION ALL
SELECT 'Employees with Multiple Assignments', COUNT(DISTINCT employee_id) 
  FROM employee_assignments WHERE is_current = true 
  GROUP BY employee_id HAVING COUNT(*) > 1;