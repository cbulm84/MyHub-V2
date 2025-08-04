-- Employee & Location Management System Schema
-- Version: 1.0
-- Description: Complete database schema with dual ID system, full history tracking, and audit trail

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB indexing capabilities
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- CORE REFERENCE TABLES
-- =====================================================

-- Addresses table: Centralized address storage
CREATE TABLE addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('PHYSICAL', 'MAILING', 'HOME', 'BILLING')),
  street_line1 VARCHAR(255) NOT NULL,
  street_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country_code VARCHAR(2) DEFAULT 'US' NOT NULL,
  phone VARCHAR(50),
  phone_type VARCHAR(20) CHECK (phone_type IN ('MAIN', 'FAX', 'MOBILE', 'OTHER')),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE addresses IS 'Centralized address storage for all entities';
COMMENT ON COLUMN addresses.phone_type IS 'Type of phone number for clarity';

-- Indexes for addresses
CREATE INDEX idx_addresses_type ON addresses(address_type);
CREATE INDEX idx_addresses_city_state ON addresses(city, state_province);
CREATE INDEX idx_addresses_active ON addresses(is_active);

-- =====================================================
-- EMPLOYEE REFERENCE TABLES
-- =====================================================

-- Termination reasons catalog
CREATE TABLE termination_reasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  termination_reason_id INTEGER UNIQUE NOT NULL,
  reason_code VARCHAR(20) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  reason_type VARCHAR(20) NOT NULL CHECK (reason_type IN ('VOLUNTARY', 'INVOLUNTARY', 'OTHER')),
  requires_details BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE termination_reasons IS 'Catalog of employee termination reasons';
COMMENT ON COLUMN termination_reasons.requires_details IS 'Whether additional notes are required when using this reason';

-- Indexes for termination_reasons
CREATE UNIQUE INDEX idx_termination_reasons_id ON termination_reasons(termination_reason_id);
CREATE UNIQUE INDEX idx_termination_reasons_code ON termination_reasons(reason_code);
CREATE INDEX idx_termination_reasons_type ON termination_reasons(reason_type);

-- Job titles catalog
CREATE TABLE job_titles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_title_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  department VARCHAR(100),
  level INTEGER,
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE job_titles IS 'Catalog of available job positions';
COMMENT ON COLUMN job_titles.level IS 'Seniority/hierarchy level for org charts';

-- Indexes for job_titles
CREATE UNIQUE INDEX idx_job_titles_id ON job_titles(job_title_id);
CREATE INDEX idx_job_titles_dept ON job_titles(department);
CREATE INDEX idx_job_titles_level ON job_titles(level);

-- User types for RBAC
CREATE TABLE user_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_type_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}' NOT NULL,
  row_level_security_config JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE user_types IS 'RBAC permission groups';
COMMENT ON COLUMN user_types.permissions IS 'Flexible permission storage (e.g., {"employees": ["read", "update"]})';

-- Indexes for user_types
CREATE UNIQUE INDEX idx_user_types_id ON user_types(user_type_id);
CREATE INDEX idx_user_types_active ON user_types(is_active);

-- =====================================================
-- ORGANIZATIONAL HIERARCHY TABLES
-- =====================================================

-- Markets: Top level organizational division
CREATE TABLE markets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  market_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  abbreviation VARCHAR(50),
  address_id UUID REFERENCES addresses(id),
  manager_employee_id INTEGER, -- Will be FK to employees.employee_id after employees table created
  gl_code VARCHAR(50),
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by UUID -- Will be FK to employees.id after employees table created
);

COMMENT ON TABLE markets IS 'Top level organizational division below company';
COMMENT ON COLUMN markets.manager_employee_id IS 'References employees.employee_id';

-- Indexes for markets
CREATE UNIQUE INDEX idx_markets_id ON markets(market_id);
CREATE INDEX idx_markets_manager ON markets(manager_employee_id);
CREATE INDEX idx_markets_active ON markets(is_active);

-- Regions: Second level organizational division
CREATE TABLE regions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  region_id INTEGER UNIQUE NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(market_id),
  name VARCHAR(255) NOT NULL,
  address_id UUID REFERENCES addresses(id),
  director_employee_id INTEGER, -- Will be FK to employees.employee_id
  gl_code VARCHAR(50),
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by UUID, -- Will be FK to employees.id
  CONSTRAINT unique_region_name_per_market UNIQUE (market_id, name)
);

COMMENT ON TABLE regions IS 'Second level organizational division';

-- Indexes for regions
CREATE UNIQUE INDEX idx_regions_id ON regions(region_id);
CREATE INDEX idx_regions_market ON regions(market_id);
CREATE INDEX idx_regions_director ON regions(director_employee_id);
CREATE INDEX idx_regions_active ON regions(is_active);

-- Districts: Third level organizational division
CREATE TABLE districts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  district_id INTEGER UNIQUE NOT NULL,
  region_id INTEGER NOT NULL REFERENCES regions(region_id),
  name VARCHAR(255) NOT NULL,
  address_id UUID REFERENCES addresses(id),
  manager_employee_id INTEGER, -- Will be FK to employees.employee_id
  gl_code VARCHAR(50),
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by UUID, -- Will be FK to employees.id
  CONSTRAINT unique_district_name_per_region UNIQUE (region_id, name)
);

COMMENT ON TABLE districts IS 'Third level organizational division';

-- Indexes for districts
CREATE UNIQUE INDEX idx_districts_id ON districts(district_id);
CREATE INDEX idx_districts_region ON districts(region_id);
CREATE INDEX idx_districts_manager ON districts(manager_employee_id);
CREATE INDEX idx_districts_active ON districts(is_active);

-- Locations: Physical stores/offices
CREATE TABLE locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id INTEGER UNIQUE NOT NULL,
  district_id INTEGER NOT NULL REFERENCES districts(district_id),
  name VARCHAR(255) NOT NULL,
  address_id UUID REFERENCES addresses(id),
  manager_employee_id INTEGER, -- Will be FK to employees.employee_id
  timezone VARCHAR(50) DEFAULT 'America/Chicago' NOT NULL,
  gl_code VARCHAR(50),
  in_footprint BOOLEAN DEFAULT true NOT NULL,
  store_number VARCHAR(50),
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by UUID, -- Will be FK to employees.id
  CONSTRAINT unique_location_name_per_district UNIQUE (district_id, name),
  CONSTRAINT unique_store_number UNIQUE (store_number)
);

COMMENT ON TABLE locations IS 'Physical stores/offices where employees work';
COMMENT ON COLUMN locations.timezone IS 'Location timezone (e.g., America/Chicago, America/New_York)';
COMMENT ON COLUMN locations.in_footprint IS 'Operational flag for location status';

-- Indexes for locations
CREATE UNIQUE INDEX idx_locations_id ON locations(location_id);
CREATE INDEX idx_locations_district ON locations(district_id);
CREATE INDEX idx_locations_manager ON locations(manager_employee_id);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_footprint ON locations(in_footprint);
CREATE INDEX idx_locations_store_num ON locations(store_number);

-- =====================================================
-- LOCATION SUPPORT TABLES
-- =====================================================

-- Location codes: Flexible code system
CREATE TABLE location_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(location_id),
  code_type VARCHAR(50) NOT NULL,
  code_value VARCHAR(100) NOT NULL,
  description TEXT,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE NOT NULL,
  expiration_date DATE,
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT check_expiration_after_effective CHECK (expiration_date IS NULL OR expiration_date > effective_date)
);

COMMENT ON TABLE location_codes IS 'Flexible code system for locations (dealer codes, vendor codes, etc.)';
COMMENT ON COLUMN location_codes.is_primary IS 'Only one primary code allowed per type per location';

-- Indexes for location_codes
CREATE INDEX idx_location_codes_location ON location_codes(location_id);
CREATE INDEX idx_location_codes_type_value ON location_codes(code_type, code_value);
CREATE INDEX idx_location_codes_effective ON location_codes(effective_date);
-- Unique constraint for primary codes
CREATE UNIQUE INDEX idx_location_codes_primary ON location_codes(location_id, code_type) 
  WHERE is_primary = true;

-- Location hours: Operating hours and exceptions
CREATE TABLE location_hours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(location_id),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false NOT NULL,
  exception_date DATE,
  exception_reason VARCHAR(255),
  effective_start_date DATE DEFAULT CURRENT_DATE NOT NULL,
  effective_end_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT check_close_after_open CHECK (close_time > open_time OR is_closed = true),
  CONSTRAINT check_hours_type CHECK (
    (day_of_week IS NOT NULL AND exception_date IS NULL) OR 
    (day_of_week IS NULL AND exception_date IS NOT NULL)
  ),
  CONSTRAINT check_effective_dates CHECK (effective_end_date IS NULL OR effective_end_date > effective_start_date)
);

COMMENT ON TABLE location_hours IS 'Store operating hours and exceptions';
COMMENT ON COLUMN location_hours.day_of_week IS '0=Sunday, 6=Saturday, NULL for exceptions';
COMMENT ON COLUMN location_hours.exception_date IS 'For holidays/special events';

-- Indexes for location_hours
CREATE INDEX idx_location_hours_location ON location_hours(location_id);
CREATE INDEX idx_location_hours_exception ON location_hours(exception_date);
CREATE INDEX idx_location_hours_effective ON location_hours(effective_start_date, effective_end_date);

-- =====================================================
-- EMPLOYEE TABLES
-- =====================================================

-- Employees: Master employee records
CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id INTEGER UNIQUE NOT NULL,
  auth_user_id UUID UNIQUE,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  user_type_id INTEGER NOT NULL REFERENCES user_types(user_type_id),
  address_id UUID REFERENCES addresses(id),
  hire_date DATE NOT NULL,
  termination_date DATE,
  termination_reason_id INTEGER REFERENCES termination_reasons(termination_reason_id),
  termination_notes TEXT,
  home_phone VARCHAR(50),
  home_phone_type VARCHAR(20) DEFAULT 'HOME' NOT NULL,
  work_phone VARCHAR(50),
  work_phone_type VARCHAR(20) DEFAULT 'WORK' NOT NULL,
  mobile_phone VARCHAR(50),
  mobile_phone_type VARCHAR(20) DEFAULT 'MOBILE' NOT NULL,
  employee_number VARCHAR(50) UNIQUE,
  file_number VARCHAR(50),
  is_full_time BOOLEAN DEFAULT true NOT NULL,
  is_on_leave BOOLEAN DEFAULT false NOT NULL,
  force_password_reset BOOLEAN DEFAULT false NOT NULL,
  integration_ids JSONB DEFAULT '{}' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by UUID, -- Self-referential FK to employees.id
  CONSTRAINT check_termination_after_hire CHECK (termination_date IS NULL OR termination_date > hire_date)
);

COMMENT ON TABLE employees IS 'Master employee records';
COMMENT ON COLUMN employees.integration_ids IS 'External system IDs (e.g., {"att_uid": "123", "sps_id": "456"})';
COMMENT ON COLUMN employees.home_phone_type IS 'Phone type for home phone';
COMMENT ON COLUMN employees.work_phone_type IS 'Phone type for work phone';
COMMENT ON COLUMN employees.mobile_phone_type IS 'Phone type for mobile phone';

-- Indexes for employees
CREATE UNIQUE INDEX idx_employees_id ON employees(employee_id);
CREATE INDEX idx_employees_auth_user ON employees(auth_user_id);
CREATE INDEX idx_employees_user_type ON employees(user_type_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_termination ON employees(termination_date);
CREATE INDEX idx_employees_fullname ON employees(last_name, first_name);

-- Employee assignments: Location/role/supervisor history
CREATE TABLE employee_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
  location_id INTEGER NOT NULL REFERENCES locations(location_id),
  job_title_id INTEGER NOT NULL REFERENCES job_titles(job_title_id),
  supervisor_employee_id INTEGER REFERENCES employees(employee_id),
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('PRIMARY', 'SECONDARY', 'TEMPORARY', 'FLOATER')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT true NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  store_override BOOLEAN DEFAULT false NOT NULL,
  reason_code VARCHAR(50),
  notes TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by UUID REFERENCES employees(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by UUID REFERENCES employees(id),
  CONSTRAINT check_end_after_start CHECK (end_date IS NULL OR end_date > start_date)
);

COMMENT ON TABLE employee_assignments IS 'Track employee location/role/supervisor history with concurrent assignments';
COMMENT ON COLUMN employee_assignments.is_primary IS 'Only one primary assignment per employee at a time';
COMMENT ON COLUMN employee_assignments.assignment_type IS 'PRIMARY for main assignment, SECONDARY/FLOATER for concurrent';

-- Indexes for employee_assignments
CREATE INDEX idx_assignments_employee ON employee_assignments(employee_id);
CREATE INDEX idx_assignments_location ON employee_assignments(location_id);
CREATE INDEX idx_assignments_supervisor ON employee_assignments(supervisor_employee_id);
CREATE INDEX idx_assignments_job_title ON employee_assignments(job_title_id);
CREATE INDEX idx_assignments_current ON employee_assignments(is_current);
CREATE INDEX idx_assignments_dates ON employee_assignments(start_date, end_date);
CREATE INDEX idx_assignments_type ON employee_assignments(assignment_type);

-- Unique constraint for primary assignments
CREATE UNIQUE INDEX idx_assignments_one_primary ON employee_assignments(employee_id, is_primary) 
  WHERE is_primary = true AND is_current = true;

-- =====================================================
-- HISTORY AND AUDIT TABLES
-- =====================================================

-- Organizational hierarchy history
CREATE TABLE org_hierarchy_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  change_date DATE NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('REORG', 'MERGER', 'SPLIT', 'RENAME', 'REASSIGN')),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('LOCATION', 'DISTRICT', 'REGION', 'MARKET')),
  entity_id INTEGER NOT NULL,
  old_parent_id INTEGER,
  new_parent_id INTEGER,
  old_values JSONB DEFAULT '{}' NOT NULL,
  new_values JSONB DEFAULT '{}' NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by UUID REFERENCES employees(id)
);

COMMENT ON TABLE org_hierarchy_history IS 'Track organizational structure changes over time';
COMMENT ON COLUMN org_hierarchy_history.entity_id IS 'Business ID (location_id, district_id, etc.) of changed entity';

-- Indexes for org_hierarchy_history
CREATE INDEX idx_org_history_date ON org_hierarchy_history(change_date);
CREATE INDEX idx_org_history_entity ON org_hierarchy_history(entity_type, entity_id);
CREATE INDEX idx_org_history_type ON org_hierarchy_history(change_type);

-- Integration sync log
CREATE TABLE integration_sync_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('REAL_TIME', 'BATCH', 'MANUAL')),
  system_name VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  external_id VARCHAR(100),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL')),
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'SYNC')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  record_count INTEGER DEFAULT 0 NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  request_data JSONB DEFAULT '{}' NOT NULL,
  response_data JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE integration_sync_log IS 'Track data synchronization with external systems';
COMMENT ON COLUMN integration_sync_log.system_name IS 'External system (PAYROLL, HR, VENDOR, ATT, SPS, etc.)';

-- Indexes for integration_sync_log
CREATE INDEX idx_sync_log_system ON integration_sync_log(system_name);
CREATE INDEX idx_sync_log_entity ON integration_sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_status ON integration_sync_log(status);
CREATE INDEX idx_sync_log_created ON integration_sync_log(created_at);
CREATE INDEX idx_sync_log_external ON integration_sync_log(external_id);

-- Audit log: Comprehensive audit trail
CREATE TABLE audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  business_id INTEGER,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  change_summary TEXT,
  user_id UUID REFERENCES employees(id),
  user_employee_id INTEGER,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all data changes';
COMMENT ON COLUMN audit_log.business_id IS 'Business ID (employee_id, location_id, etc.) for cross-reference';

-- Indexes for audit_log
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_table_business ON audit_log(table_name, business_id);
CREATE INDEX idx_audit_user_employee ON audit_log(user_employee_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_action ON audit_log(action);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add employee references after employees table exists
ALTER TABLE markets 
  ADD CONSTRAINT fk_markets_manager FOREIGN KEY (manager_employee_id) REFERENCES employees(employee_id),
  ADD CONSTRAINT fk_markets_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id);

ALTER TABLE regions 
  ADD CONSTRAINT fk_regions_director FOREIGN KEY (director_employee_id) REFERENCES employees(employee_id),
  ADD CONSTRAINT fk_regions_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id);

ALTER TABLE districts 
  ADD CONSTRAINT fk_districts_manager FOREIGN KEY (manager_employee_id) REFERENCES employees(employee_id),
  ADD CONSTRAINT fk_districts_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id);

ALTER TABLE locations 
  ADD CONSTRAINT fk_locations_manager FOREIGN KEY (manager_employee_id) REFERENCES employees(employee_id),
  ADD CONSTRAINT fk_locations_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id);

ALTER TABLE employees 
  ADD CONSTRAINT fk_employees_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Current employee locations with full hierarchy
CREATE VIEW current_employee_locations AS
SELECT 
  e.employee_id,
  e.first_name,
  e.last_name,
  e.email,
  e.is_active AS employee_active,
  ea.location_id,
  l.name AS location_name,
  l.store_number,
  ea.job_title_id,
  jt.name AS job_title,
  ea.supervisor_employee_id,
  s.first_name AS supervisor_first_name,
  s.last_name AS supervisor_last_name,
  ea.assignment_type,
  ea.is_primary,
  ea.start_date,
  d.district_id,
  d.name AS district_name,
  r.region_id,
  r.name AS region_name,
  m.market_id,
  m.name AS market_name
FROM employees e
INNER JOIN employee_assignments ea ON e.employee_id = ea.employee_id
INNER JOIN locations l ON ea.location_id = l.location_id
INNER JOIN job_titles jt ON ea.job_title_id = jt.job_title_id
LEFT JOIN employees s ON ea.supervisor_employee_id = s.employee_id
INNER JOIN districts d ON l.district_id = d.district_id
INNER JOIN regions r ON d.region_id = r.region_id
INNER JOIN markets m ON r.market_id = m.market_id
WHERE ea.is_current = true;

COMMENT ON VIEW current_employee_locations IS 'Current employee assignments with full location hierarchy';

-- Employee assignment timeline
CREATE VIEW employee_assignment_timeline AS
SELECT 
  ea.employee_id,
  e.first_name,
  e.last_name,
  ea.location_id,
  l.name AS location_name,
  ea.job_title_id,
  jt.name AS job_title,
  ea.assignment_type,
  ea.is_primary,
  ea.start_date,
  ea.end_date,
  ea.is_current,
  ea.supervisor_employee_id,
  s.first_name AS supervisor_first_name,
  s.last_name AS supervisor_last_name,
  ea.reason_code,
  ea.notes
FROM employee_assignments ea
INNER JOIN employees e ON ea.employee_id = e.employee_id
INNER JOIN locations l ON ea.location_id = l.location_id
INNER JOIN job_titles jt ON ea.job_title_id = jt.job_title_id
LEFT JOIN employees s ON ea.supervisor_employee_id = s.employee_id
ORDER BY ea.employee_id, ea.start_date DESC;

COMMENT ON VIEW employee_assignment_timeline IS 'Complete assignment history for all employees';

-- Organization structure tree
CREATE VIEW org_structure_tree AS
WITH RECURSIVE org_tree AS (
  -- Markets (top level)
  SELECT 
    'MARKET' AS level_type,
    m.market_id AS entity_id,
    m.name AS entity_name,
    NULL::INTEGER AS parent_id,
    1 AS level_depth,
    m.market_id,
    NULL::INTEGER AS region_id,
    NULL::INTEGER AS district_id,
    NULL::INTEGER AS location_id
  FROM markets m
  WHERE m.is_active = true
  
  UNION ALL
  
  -- Regions
  SELECT 
    'REGION' AS level_type,
    r.region_id AS entity_id,
    r.name AS entity_name,
    r.market_id AS parent_id,
    2 AS level_depth,
    r.market_id,
    r.region_id,
    NULL::INTEGER AS district_id,
    NULL::INTEGER AS location_id
  FROM regions r
  WHERE r.is_active = true
  
  UNION ALL
  
  -- Districts
  SELECT 
    'DISTRICT' AS level_type,
    d.district_id AS entity_id,
    d.name AS entity_name,
    d.region_id AS parent_id,
    3 AS level_depth,
    r.market_id,
    d.region_id,
    d.district_id,
    NULL::INTEGER AS location_id
  FROM districts d
  INNER JOIN regions r ON d.region_id = r.region_id
  WHERE d.is_active = true
  
  UNION ALL
  
  -- Locations
  SELECT 
    'LOCATION' AS level_type,
    l.location_id AS entity_id,
    l.name AS entity_name,
    l.district_id AS parent_id,
    4 AS level_depth,
    m.market_id,
    r.region_id,
    d.district_id,
    l.location_id
  FROM locations l
  INNER JOIN districts d ON l.district_id = d.district_id
  INNER JOIN regions r ON d.region_id = r.region_id
  INNER JOIN markets m ON r.market_id = m.market_id
  WHERE l.is_active = true
)
SELECT * FROM org_tree
ORDER BY market_id, region_id NULLS FIRST, district_id NULLS FIRST, location_id NULLS FIRST;

COMMENT ON VIEW org_structure_tree IS 'Hierarchical view of organizational structure';

-- Location employee counts
CREATE VIEW location_employee_counts AS
SELECT 
  l.location_id,
  l.name AS location_name,
  l.district_id,
  d.name AS district_name,
  r.region_id,
  r.name AS region_name,
  m.market_id,
  m.name AS market_name,
  COUNT(DISTINCT CASE WHEN ea.is_primary = true THEN ea.employee_id END) AS primary_count,
  COUNT(DISTINCT CASE WHEN ea.is_primary = false THEN ea.employee_id END) AS secondary_count,
  COUNT(DISTINCT ea.employee_id) AS total_count
FROM locations l
INNER JOIN districts d ON l.district_id = d.district_id
INNER JOIN regions r ON d.region_id = r.region_id
INNER JOIN markets m ON r.market_id = m.market_id
LEFT JOIN employee_assignments ea ON l.location_id = ea.location_id AND ea.is_current = true
WHERE l.is_active = true
GROUP BY l.location_id, l.name, l.district_id, d.name, r.region_id, r.name, m.market_id, m.name;

COMMENT ON VIEW location_employee_counts IS 'Employee counts by location with hierarchy';

-- Active concurrent assignments
CREATE VIEW active_concurrent_assignments AS
SELECT 
  e.employee_id,
  e.first_name,
  e.last_name,
  e.email,
  COUNT(*) AS assignment_count,
  COUNT(CASE WHEN ea.is_primary = true THEN 1 END) AS primary_count,
  COUNT(CASE WHEN ea.is_primary = false THEN 1 END) AS secondary_count,
  ARRAY_AGG(l.name ORDER BY ea.is_primary DESC, ea.start_date) AS location_names,
  ARRAY_AGG(ea.assignment_type ORDER BY ea.is_primary DESC, ea.start_date) AS assignment_types
FROM employees e
INNER JOIN employee_assignments ea ON e.employee_id = ea.employee_id
INNER JOIN locations l ON ea.location_id = l.location_id
WHERE ea.is_current = true
GROUP BY e.employee_id, e.first_name, e.last_name, e.email
HAVING COUNT(*) > 1;

COMMENT ON VIEW active_concurrent_assignments IS 'Employees with multiple current assignments';

-- =====================================================
-- ROW LEVEL SECURITY SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_hierarchy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your auth system)
-- Example: Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON employees
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read" ON locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA public IS 'Employee and Location Management System - Alliance Mobile';