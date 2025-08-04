import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check current state
    const { data: tableCheck } = await supabase.rpc('table_exists', { 
      table_name: 'companies' 
    }).single()
    
    if (tableCheck) {
      return NextResponse.json({ 
        error: 'Companies table already exists. Migration may have been run already.' 
      }, { status: 400 })
    }

    // Get current counts
    const { count: marketCount } = await supabase.from('markets').select('*', { count: 'exact', head: true })
    const { count: regionCount } = await supabase.from('regions').select('*', { count: 'exact', head: true })
    const { count: districtCount } = await supabase.from('districts').select('*', { count: 'exact', head: true })
    const { count: locationCount } = await supabase.from('locations').select('*', { count: 'exact', head: true })

    const currentState = {
      markets: marketCount || 0,
      regions: regionCount || 0,
      districts: districtCount || 0,
      locations: locationCount || 0
    }

    // Execute migration steps
    const results = []

    try {
      // Step 1: Create new tables
      const { error: tablesError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Companies table
          CREATE TABLE IF NOT EXISTS companies (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            company_id INTEGER UNIQUE NOT NULL,
            name VARCHAR(255) UNIQUE NOT NULL,
            legal_name VARCHAR(255),
            tax_id VARCHAR(50),
            address_id UUID REFERENCES addresses(id),
            phone VARCHAR(50),
            email VARCHAR(255),
            website VARCHAR(255),
            logo_url VARCHAR(500),
            metadata JSONB DEFAULT '{}' NOT NULL,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
          );

          -- Divisions table
          CREATE TABLE IF NOT EXISTS divisions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            division_id INTEGER UNIQUE NOT NULL,
            company_id INTEGER NOT NULL REFERENCES companies(company_id),
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50),
            address_id UUID REFERENCES addresses(id),
            director_employee_id INTEGER,
            gl_code VARCHAR(50),
            metadata JSONB DEFAULT '{}' NOT NULL,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_by UUID,
            CONSTRAINT unique_division_name_per_company UNIQUE (company_id, name)
          );
        `
      })
      
      if (tablesError) throw tablesError
      results.push({ step: 'Create tables', status: 'success' })

      // Step 2: Create backups
      const { error: backupError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS _backup_markets AS SELECT * FROM markets;
          CREATE TABLE IF NOT EXISTS _backup_regions AS SELECT * FROM regions;
          CREATE TABLE IF NOT EXISTS _backup_districts AS SELECT * FROM districts;
          CREATE TABLE IF NOT EXISTS _backup_locations AS SELECT * FROM locations;
        `
      })
      
      if (backupError) throw backupError
      results.push({ step: 'Create backups', status: 'success' })

      // Step 3: Drop constraints
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE regions DROP CONSTRAINT IF EXISTS regions_market_id_fkey;
          ALTER TABLE districts DROP CONSTRAINT IF EXISTS districts_region_id_fkey;
          ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_district_id_fkey;
        `
      })
      
      if (dropError) throw dropError
      results.push({ step: 'Drop constraints', status: 'success' })

      // Step 4: Add columns
      const { error: columnsError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE regions 
            ADD COLUMN IF NOT EXISTS division_id INTEGER,
            ADD COLUMN IF NOT EXISTS code VARCHAR(50);
          
          ALTER TABLE markets 
            ADD COLUMN IF NOT EXISTS region_id INTEGER,
            ADD COLUMN IF NOT EXISTS code VARCHAR(50);
          
          ALTER TABLE districts 
            ADD COLUMN IF NOT EXISTS market_id INTEGER;
        `
      })
      
      if (columnsError) throw columnsError
      results.push({ step: 'Add columns', status: 'success' })

      // Step 5: Insert defaults
      const { error: defaultsError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO companies (company_id, name, legal_name, email, is_active)
          VALUES (1, 'Alliance Mobile', 'Alliance Mobile Inc.', 'info@alliancemobile.com', true)
          ON CONFLICT (company_id) DO NOTHING;

          INSERT INTO divisions (division_id, company_id, name, code, is_active)
          VALUES (1, 1, 'Retail Operations', 'RETAIL', true)
          ON CONFLICT (division_id) DO NOTHING;
        `
      })
      
      if (defaultsError) throw defaultsError
      results.push({ step: 'Insert defaults', status: 'success' })

      // Step 6: Migrate relationships
      const { error: migrateError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Update regions to point to division
          UPDATE regions SET division_id = 1 WHERE division_id IS NULL;
          
          -- Update markets with their region relationships
          UPDATE markets m
          SET region_id = r.region_id
          FROM regions r
          WHERE r.market_id = m.market_id;
          
          -- Update districts to point to markets
          UPDATE districts d
          SET market_id = r.market_id
          FROM regions r
          WHERE d.region_id = r.region_id;
        `
      })
      
      if (migrateError) throw migrateError
      results.push({ step: 'Migrate relationships', status: 'success' })

      // Step 7: Re-create constraints
      const { error: constraintsError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE regions 
            ADD CONSTRAINT regions_division_id_fkey 
            FOREIGN KEY (division_id) REFERENCES divisions(division_id);
          
          ALTER TABLE markets 
            ADD CONSTRAINT markets_region_id_fkey 
            FOREIGN KEY (region_id) REFERENCES regions(region_id);
          
          ALTER TABLE districts 
            ADD CONSTRAINT districts_market_id_fkey 
            FOREIGN KEY (market_id) REFERENCES markets(market_id);
          
          ALTER TABLE locations 
            ADD CONSTRAINT locations_district_id_fkey 
            FOREIGN KEY (district_id) REFERENCES districts(district_id);
        `
      })
      
      if (constraintsError) throw constraintsError
      results.push({ step: 'Re-create constraints', status: 'success' })

      // Get new counts
      const { count: newCompanyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true })
      const { count: newDivisionCount } = await supabase.from('divisions').select('*', { count: 'exact', head: true })

      const newState = {
        companies: newCompanyCount || 0,
        divisions: newDivisionCount || 0,
        ...currentState
      }

      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        currentState,
        newState,
        results
      })

    } catch (error: any) {
      return NextResponse.json({
        error: 'Migration failed',
        details: error.message,
        results
      }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to connect to database',
      details: error.message
    }, { status: 500 })
  }
}