import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { parse } from 'csv-parse/sync'

interface ImportResult {
  imported: number
  failed: number
  errors: string[]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'locations' | 'employees'
    
    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()
    
    // Remove comment lines (starting with #)
    const cleanContent = content
      .split('\n')
      .filter(line => !line.trim().startsWith('#'))
      .join('\n')
    
    // Parse CSV
    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value) => {
        if (value === '') return null
        if (value.toLowerCase() === 'true') return true
        if (value.toLowerCase() === 'false') return false
        return value
      }
    })

    const supabase = await createServerClient()
    
    // Import based on type
    let result: ImportResult
    if (type === 'locations') {
      result = await importLocations(supabase, records)
    } else {
      result = await importEmployees(supabase, records)
    }

    return NextResponse.json({
      message: `Import completed: ${result.imported} succeeded, ${result.failed} failed`,
      details: result
    })

  } catch (error) {
    console.error('Import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Import failed', details: { errors: [errorMessage] } },
      { status: 500 }
    )
  }
}

async function importLocations(supabase: any, records: any[]): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    failed: 0,
    errors: []
  }

  // Pre-validate all foreign keys
  const districtIds = [...new Set(records.map(r => r.district_id).filter(Boolean))]
  const managerIds = [...new Set(records.map(r => r.manager_employee_id).filter(Boolean))]
  
  // Check districts exist
  const { data: existingDistricts } = await supabase
    .from('districts')
    .select('district_id')
    .in('district_id', districtIds)
  
  const validDistrictIds = new Set(existingDistricts?.map((d: any) => d.district_id) || [])
  
  // Check managers exist (if any specified)
  let validManagerIds = new Set()
  if (managerIds.length > 0) {
    const { data: existingManagers } = await supabase
      .from('employees')
      .select('employee_id')
      .in('employee_id', managerIds)
    validManagerIds = new Set(existingManagers?.map(e => e.employee_id) || [])
  }

  for (const record of records) {
    try {
      // Validate required fields
      if (!record.location_id || !record.district_id || !record.name) {
        throw new Error(`Missing required fields for location: ${JSON.stringify(record)}`)
      }

      // Check if district exists
      if (!validDistrictIds.has(parseInt(record.district_id))) {
        throw new Error(`District ID ${record.district_id} not found. Please ensure districts exist before importing locations.`)
      }
      
      // Check if manager exists (if specified)
      if (record.manager_employee_id && !validManagerIds.has(parseInt(record.manager_employee_id))) {
        throw new Error(`Manager employee ID ${record.manager_employee_id} not found. Import employees first or leave manager_employee_id empty.`)
      }

      // Create address if provided
      let addressId = null
      if (record.street_line1 && record.city && record.state_province && record.postal_code) {
        const { data: address, error: addressError } = await supabase
          .from('addresses')
          .insert({
            address_type: 'PHYSICAL',
            street_line1: record.street_line1,
            street_line2: record.street_line2 || null,
            city: record.city,
            state_province: record.state_province,
            postal_code: record.postal_code,
            country_code: record.country_code || 'US',
            phone: record.phone || null,
            phone_type: record.phone_type || 'MAIN'
          })
          .select()
          .single()

        if (addressError) throw addressError
        addressId = address.id
      }

      // Insert location
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          location_id: parseInt(record.location_id),
          district_id: parseInt(record.district_id),
          name: record.name,
          address_id: addressId,
          manager_employee_id: record.manager_employee_id ? parseInt(record.manager_employee_id) : null,
          timezone: record.timezone || 'America/Chicago',
          gl_code: record.gl_code || null,
          in_footprint: record.in_footprint !== false,
          store_number: record.store_number || null,
          is_active: record.is_active !== false
        })

      if (locationError) throw locationError
      result.imported++

    } catch (error) {
      result.failed++
      result.errors.push(`Location ${record.location_id}: ${error.message}`)
    }
  }

  return result
}

async function importEmployees(supabase: any, records: any[]): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    failed: 0,
    errors: []
  }

  // Pre-validate all foreign keys
  const userTypeIds = [...new Set(records.map(r => r.user_type_id || 3))]
  const locationIds = [...new Set(records.map(r => r.location_id).filter(Boolean))]
  const jobTitleIds = [...new Set(records.map(r => r.job_title_id).filter(Boolean))]
  const supervisorIds = [...new Set(records.map(r => r.supervisor_employee_id).filter(Boolean))]
  const terminationReasonIds = [...new Set(records.map(r => r.termination_reason_id).filter(Boolean))]
  
  // Check user types exist
  const { data: existingUserTypes } = await supabase
    .from('user_types')
    .select('user_type_id')
    .in('user_type_id', userTypeIds)
  const validUserTypeIds = new Set(existingUserTypes?.map(u => u.user_type_id) || [])
  
  // Check locations exist (for assignments)
  let validLocationIds = new Set()
  if (locationIds.length > 0) {
    const { data: existingLocations } = await supabase
      .from('locations')
      .select('location_id')
      .in('location_id', locationIds)
    validLocationIds = new Set(existingLocations?.map(l => l.location_id) || [])
  }
  
  // Check job titles exist (for assignments)
  let validJobTitleIds = new Set()
  if (jobTitleIds.length > 0) {
    const { data: existingJobTitles } = await supabase
      .from('job_titles')
      .select('job_title_id')
      .in('job_title_id', jobTitleIds)
    validJobTitleIds = new Set(existingJobTitles?.map(j => j.job_title_id) || [])
  }
  
  // Check supervisors exist
  let validSupervisorIds = new Set()
  if (supervisorIds.length > 0) {
    const { data: existingSupervisors } = await supabase
      .from('employees')
      .select('employee_id')
      .in('employee_id', supervisorIds)
    validSupervisorIds = new Set(existingSupervisors?.map(e => e.employee_id) || [])
  }
  
  // Check termination reasons exist
  let validTerminationReasonIds = new Set()
  if (terminationReasonIds.length > 0) {
    const { data: existingReasons } = await supabase
      .from('termination_reasons')
      .select('termination_reason_id')
      .in('termination_reason_id', terminationReasonIds)
    validTerminationReasonIds = new Set(existingReasons?.map(t => t.termination_reason_id) || [])
  }

  for (const record of records) {
    try {
      // Validate required fields
      if (!record.employee_id || !record.username || !record.email || 
          !record.first_name || !record.last_name) {
        throw new Error(`Missing required fields for employee: ${JSON.stringify(record)}`)
      }
      
      // Validate user type
      const userTypeId = parseInt(record.user_type_id) || 3
      if (!validUserTypeIds.has(userTypeId)) {
        throw new Error(`User type ID ${userTypeId} not found. Valid values are: ${[...validUserTypeIds].join(', ')}`)
      }
      
      // Validate termination reason if provided
      if (record.termination_reason_id && !validTerminationReasonIds.has(parseInt(record.termination_reason_id))) {
        throw new Error(`Termination reason ID ${record.termination_reason_id} not found`)
      }
      
      // Validate assignment fields if provided
      if (record.location_id && !validLocationIds.has(parseInt(record.location_id))) {
        throw new Error(`Location ID ${record.location_id} not found. Import locations first.`)
      }
      
      if (record.job_title_id && !validJobTitleIds.has(parseInt(record.job_title_id))) {
        throw new Error(`Job title ID ${record.job_title_id} not found. Ensure job titles are configured.`)
      }
      
      if (record.supervisor_employee_id && !validSupervisorIds.has(parseInt(record.supervisor_employee_id))) {
        throw new Error(`Supervisor employee ID ${record.supervisor_employee_id} not found. Import supervisors first.`)
      }

      // Create address if provided
      let addressId = null
      if (record.street_line1 && record.city && record.state_province && record.postal_code) {
        const { data: address, error: addressError } = await supabase
          .from('addresses')
          .insert({
            address_type: 'HOME',
            street_line1: record.street_line1,
            street_line2: record.street_line2 || null,
            city: record.city,
            state_province: record.state_province,
            postal_code: record.postal_code,
            country_code: record.country_code || 'US'
          })
          .select()
          .single()

        if (addressError) throw addressError
        addressId = address.id
      }

      // Insert employee
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          employee_id: parseInt(record.employee_id),
          username: record.username,
          email: record.email,
          first_name: record.first_name,
          last_name: record.last_name,
          user_type_id: parseInt(record.user_type_id) || 3,
          address_id: addressId,
          hire_date: record.hire_date,
          termination_date: record.termination_date || null,
          termination_reason_id: record.termination_reason_id ? parseInt(record.termination_reason_id) : null,
          home_phone: record.home_phone || null,
          work_phone: record.work_phone || null,
          mobile_phone: record.mobile_phone || null,
          employee_number: record.employee_number || null,
          is_full_time: record.is_full_time !== false,
          is_active: record.is_active !== false
        })

      if (employeeError) throw employeeError

      // Create assignment if location and job title provided
      if (record.location_id && record.job_title_id) {
        const { error: assignmentError } = await supabase
          .from('employee_assignments')
          .insert({
            employee_id: parseInt(record.employee_id),
            location_id: parseInt(record.location_id),
            job_title_id: parseInt(record.job_title_id),
            supervisor_employee_id: record.supervisor_employee_id ? parseInt(record.supervisor_employee_id) : null,
            assignment_type: 'PRIMARY',
            start_date: record.assignment_start_date || record.hire_date,
            is_current: true,
            is_primary: true
          })

        if (assignmentError) {
          // Non-fatal - employee was created but assignment failed
          result.errors.push(`Assignment for ${record.employee_id}: ${assignmentError.message}`)
        }
      }

      result.imported++

    } catch (error) {
      result.failed++
      result.errors.push(`Employee ${record.employee_id}: ${error.message}`)
    }
  }

  return result
}