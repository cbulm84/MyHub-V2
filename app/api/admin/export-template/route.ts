import { NextRequest, NextResponse } from 'next/server'

// Define template structures
const templates = {
  locations: {
    headers: [
      'location_id',
      'company_id',
      'division_id',
      'region_id',
      'market_id',
      'district_id',
      'name',
      'store_number',
      'street_line1',
      'street_line2',
      'city',
      'state_province',
      'postal_code',
      'country_code',
      'phone',
      'phone_type',
      'manager_employee_id',
      'timezone',
      'gl_code',
      'in_footprint',
      'is_active'
    ],
    sampleRow: [
      '101',
      '1',
      '1',
      '1',
      '1',
      '1',
      'Dallas Downtown',
      'S001',
      '100 Main St',
      '',
      'Dallas',
      'TX',
      '75201',
      'US',
      '214-555-0100',
      'MAIN',
      '',
      'America/Chicago',
      'GL-LOC-001',
      'true',
      'true'
    ],
    instructions: [
      '# LOCATION IMPORT TEMPLATE',
      '# Required fields: location_id, district_id, name',
      '# Optional fields: All others',
      '# Notes:',
      '#   - location_id must be unique',
      '#   - company_id defaults to 1 (Alliance Mobile)',
      '#   - division_id defaults to 1 (Retail Operations)',
      '#   - Full hierarchy must exist: company → division → region → market → district',
      '#   - district_id must exist in the system',
      '#   - phone_type options: MAIN, FAX, MOBILE, OTHER',
      '#   - timezone examples: America/Chicago, America/New_York',
      '#   - in_footprint and is_active: true or false',
      '#   - Leave manager_employee_id empty if not assigning',
      '# Delete these comment lines before importing'
    ]
  },
  employees: {
    headers: [
      'employee_id',
      'username',
      'email',
      'first_name',
      'last_name',
      'user_type_id',
      'hire_date',
      'termination_date',
      'termination_reason_id',
      'employee_number',
      'home_phone',
      'work_phone',
      'mobile_phone',
      'is_full_time',
      'is_active',
      'street_line1',
      'street_line2',
      'city',
      'state_province',
      'postal_code',
      'country_code',
      'location_id',
      'job_title_id',
      'supervisor_employee_id',
      'assignment_start_date'
    ],
    sampleRow: [
      '1001',
      'jsmith',
      'john.smith@company.com',
      'John',
      'Smith',
      '3',
      '2020-01-15',
      '',
      '',
      'EMP001',
      '214-555-1234',
      '',
      '469-555-5678',
      'true',
      'true',
      '123 Main St',
      'Apt 4B',
      'Dallas',
      'TX',
      '75201',
      'US',
      '101',
      '6',
      '',
      '2020-01-15'
    ],
    instructions: [
      '# EMPLOYEE IMPORT TEMPLATE',
      '# Required fields: employee_id, username, email, first_name, last_name',
      '# Optional fields: All others',
      '# Notes:',
      '#   - employee_id must be unique',
      '#   - username and email must be unique',
      '#   - user_type_id: 1=ADMIN, 2=MANAGER, 3=EMPLOYEE, 4=HR, 5=EXECUTIVE',
      '#   - Date format: YYYY-MM-DD',
      '#   - is_full_time and is_active: true or false',
      '#   - Address fields create home address if provided',
      '#   - location_id and job_title_id create initial assignment if both provided',
      '#   - Leave termination fields empty for active employees',
      '# Delete these comment lines before importing'
    ]
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') as 'locations' | 'employees'
  
  if (!type || !templates[type]) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }

  const template = templates[type]
  
  // Build CSV content
  const csvLines: string[] = []
  
  // Add instructions as comments
  template.instructions.forEach(line => csvLines.push(line))
  csvLines.push('') // Empty line after instructions
  
  // Add headers
  csvLines.push(template.headers.join(','))
  
  // Add sample row
  csvLines.push(template.sampleRow.join(','))
  
  // Convert to CSV string
  const csvContent = csvLines.join('\n')
  
  // Return as downloadable CSV
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-import-template.csv"`
    }
  })
}