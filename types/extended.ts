// Extended types for components that build on database types
import { Database } from './database'

export type Location = Database['public']['Tables']['locations']['Row']
export type District = Database['public']['Tables']['districts']['Row']
export type Region = Database['public']['Tables']['regions']['Row']
export type Market = Database['public']['Tables']['markets']['Row']
export type Employee = Database['public']['Tables']['employees']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']

// Location with optional hierarchy and address data
export type LocationWithDetails = Location & {
  // Optional address data (when joined)
  addresses?: Address
  
  // Optional manager data
  manager?: {
    employee_id: number
    first_name: string
    last_name: string
  } | null
  
  // Optional hierarchy data
  districts?: {
    name: string
    manager?: {
      employee_id: number
      first_name: string
      last_name: string
    } | null
    regions?: {
      name: string
      markets?: {
        name: string
      }
    }
  }
  
  // Optional employee count
  employee_count?: number
  
  // Legacy fields for backward compatibility (not in DB)
  address_line_1?: never
  address_line_2?: never
  city?: never
  state?: never
  zip_code?: never
  phone?: never
}

// Employee with extended data
export type EmployeeWithDetails = Employee & {
  addresses?: Address
  user_types?: {
    user_type_id: number
    name: string
    description?: string | null
  }
  current_assignments?: Array<{
    location_id: number
    job_title_id: number
    assignment_type: string
    start_date: string
    is_primary: boolean
  }>
}

// Region with market_id (correct hierarchy)
export type RegionWithMarket = Region & {
  market?: Market
}

// For components expecting old structure
export type MarketWithRegions = Market & {
  regions?: Region[]
}