export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_type: string
          city: string
          country_code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          phone: string | null
          phone_type: string | null
          postal_code: string
          state_province: string
          street_line1: string
          street_line2: string | null
          updated_at: string
        }
        Insert: {
          address_type: string
          city: string
          country_code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          phone_type?: string | null
          postal_code: string
          state_province: string
          street_line1: string
          street_line2?: string | null
          updated_at?: string
        }
        Update: {
          address_type?: string
          city?: string
          country_code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          phone_type?: string | null
          postal_code?: string
          state_province?: string
          street_line1?: string
          street_line2?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          business_id: number | null
          change_summary: string | null
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_employee_id: number | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id?: number | null
          change_summary?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_employee_id?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: number | null
          change_summary?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_employee_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          address_id: string | null
          created_at: string
          district_id: number
          gl_code: string | null
          id: string
          is_active: boolean
          manager_employee_id: number | null
          metadata: Json
          name: string
          region_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          district_id: number
          gl_code?: string | null
          id?: string
          is_active?: boolean
          manager_employee_id?: number | null
          metadata?: Json
          name: string
          region_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string
          district_id?: number
          gl_code?: string | null
          id?: string
          is_active?: boolean
          manager_employee_id?: number | null
          metadata?: Json
          name?: string
          region_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "fk_districts_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_districts_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_districts_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_districts_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_assignments: {
        Row: {
          assignment_type: string
          created_at: string
          created_by: string | null
          employee_id: number
          end_date: string | null
          id: string
          is_current: boolean
          is_primary: boolean
          job_title_id: number
          location_id: number
          metadata: Json
          notes: string | null
          reason_code: string | null
          start_date: string
          store_override: boolean
          supervisor_employee_id: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignment_type: string
          created_at?: string
          created_by?: string | null
          employee_id: number
          end_date?: string | null
          id?: string
          is_current?: boolean
          is_primary?: boolean
          job_title_id: number
          location_id: number
          metadata?: Json
          notes?: string | null
          reason_code?: string | null
          start_date: string
          store_override?: boolean
          supervisor_employee_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignment_type?: string
          created_at?: string
          created_by?: string | null
          employee_id?: number
          end_date?: string | null
          id?: string
          is_current?: boolean
          is_primary?: boolean
          job_title_id?: number
          location_id?: number
          metadata?: Json
          notes?: string | null
          reason_code?: string | null
          start_date?: string
          store_override?: boolean
          supervisor_employee_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["job_title_id"]
          },
          {
            foreignKeyName: "employee_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "employee_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_id: string | null
          auth_user_id: string | null
          created_at: string
          email: string
          employee_id: number
          employee_number: string | null
          file_number: string | null
          first_name: string
          force_password_reset: boolean
          hire_date: string
          home_phone: string | null
          home_phone_type: string
          id: string
          integration_ids: Json
          is_active: boolean
          is_full_time: boolean
          is_on_leave: boolean
          last_name: string
          metadata: Json
          mobile_phone: string | null
          mobile_phone_type: string
          termination_date: string | null
          termination_notes: string | null
          termination_reason_id: number | null
          updated_at: string
          updated_by: string | null
          user_type_id: number
          username: string
          work_phone: string | null
          work_phone_type: string
        }
        Insert: {
          address_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          email: string
          employee_id: number
          employee_number?: string | null
          file_number?: string | null
          first_name: string
          force_password_reset?: boolean
          hire_date: string
          home_phone?: string | null
          home_phone_type?: string
          id?: string
          integration_ids?: Json
          is_active?: boolean
          is_full_time?: boolean
          is_on_leave?: boolean
          last_name: string
          metadata?: Json
          mobile_phone?: string | null
          mobile_phone_type?: string
          termination_date?: string | null
          termination_notes?: string | null
          termination_reason_id?: number | null
          updated_at?: string
          updated_by?: string | null
          user_type_id: number
          username: string
          work_phone?: string | null
          work_phone_type?: string
        }
        Update: {
          address_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string
          employee_id?: number
          employee_number?: string | null
          file_number?: string | null
          first_name?: string
          force_password_reset?: boolean
          hire_date?: string
          home_phone?: string | null
          home_phone_type?: string
          id?: string
          integration_ids?: Json
          is_active?: boolean
          is_full_time?: boolean
          is_on_leave?: boolean
          last_name?: string
          metadata?: Json
          mobile_phone?: string | null
          mobile_phone_type?: string
          termination_date?: string | null
          termination_notes?: string | null
          termination_reason_id?: number | null
          updated_at?: string
          updated_by?: string | null
          user_type_id?: number
          username?: string
          work_phone?: string | null
          work_phone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_termination_reason_id_fkey"
            columns: ["termination_reason_id"]
            isOneToOne: false
            referencedRelation: "termination_reasons"
            referencedColumns: ["termination_reason_id"]
          },
          {
            foreignKeyName: "employees_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_types"
            referencedColumns: ["user_type_id"]
          },
          {
            foreignKeyName: "fk_employees_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_log: {
        Row: {
          completed_at: string | null
          created_at: string
          direction: string
          entity_id: string
          entity_type: string
          error_message: string | null
          external_id: string | null
          id: string
          operation: string
          record_count: number
          request_data: Json
          response_data: Json
          retry_count: number
          started_at: string | null
          status: string
          sync_type: string
          system_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          direction: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          operation: string
          record_count?: number
          request_data?: Json
          response_data?: Json
          retry_count?: number
          started_at?: string | null
          status: string
          sync_type: string
          system_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          direction?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          operation?: string
          record_count?: number
          request_data?: Json
          response_data?: Json
          retry_count?: number
          started_at?: string | null
          status?: string
          sync_type?: string
          system_name?: string
        }
        Relationships: []
      }
      job_titles: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_active: boolean
          job_title_id: number
          level: number | null
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          job_title_id: number
          level?: number | null
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          job_title_id?: number
          level?: number | null
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      location_codes: {
        Row: {
          code_type: string
          code_value: string
          created_at: string
          description: string | null
          effective_date: string
          expiration_date: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          location_id: number
          metadata: Json
          updated_at: string
        }
        Insert: {
          code_type: string
          code_value: string
          created_at?: string
          description?: string | null
          effective_date?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          location_id: number
          metadata?: Json
          updated_at?: string
        }
        Update: {
          code_type?: string
          code_value?: string
          created_at?: string
          description?: string | null
          effective_date?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          location_id?: number
          metadata?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_codes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "location_codes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
        ]
      }
      location_hours: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: number | null
          effective_end_date: string | null
          effective_start_date: string
          exception_date: string | null
          exception_reason: string | null
          id: string
          is_active: boolean
          is_closed: boolean
          location_id: number
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number | null
          effective_end_date?: string | null
          effective_start_date?: string
          exception_date?: string | null
          exception_reason?: string | null
          id?: string
          is_active?: boolean
          is_closed?: boolean
          location_id: number
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number | null
          effective_end_date?: string | null
          effective_start_date?: string
          exception_date?: string | null
          exception_reason?: string | null
          id?: string
          is_active?: boolean
          is_closed?: boolean
          location_id?: number
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "location_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
        ]
      }
      locations: {
        Row: {
          address_id: string | null
          created_at: string
          district_id: number
          gl_code: string | null
          id: string
          in_footprint: boolean
          is_active: boolean
          location_id: number
          manager_employee_id: number | null
          metadata: Json
          name: string
          store_number: string | null
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          district_id: number
          gl_code?: string | null
          id?: string
          in_footprint?: boolean
          is_active?: boolean
          location_id: number
          manager_employee_id?: number | null
          metadata?: Json
          name: string
          store_number?: string | null
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string
          district_id?: number
          gl_code?: string | null
          id?: string
          in_footprint?: boolean
          is_active?: boolean
          location_id?: number
          manager_employee_id?: number | null
          metadata?: Json
          name?: string
          store_number?: string | null
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_locations_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_locations_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_locations_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_locations_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["district_id"]
          },
          {
            foreignKeyName: "locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_id"]
          },
        ]
      }
      markets: {
        Row: {
          abbreviation: string | null
          address_id: string | null
          created_at: string
          gl_code: string | null
          id: string
          is_active: boolean
          manager_employee_id: number | null
          market_id: number
          metadata: Json
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          abbreviation?: string | null
          address_id?: string | null
          created_at?: string
          gl_code?: string | null
          id?: string
          is_active?: boolean
          manager_employee_id?: number | null
          market_id: number
          metadata?: Json
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          abbreviation?: string | null
          address_id?: string | null
          created_at?: string
          gl_code?: string | null
          id?: string
          is_active?: boolean
          manager_employee_id?: number | null
          market_id?: number
          metadata?: Json
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_markets_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_markets_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_markets_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_markets_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      org_hierarchy_history: {
        Row: {
          change_date: string
          change_type: string
          created_at: string
          created_by: string | null
          entity_id: number
          entity_type: string
          id: string
          new_parent_id: number | null
          new_values: Json
          old_parent_id: number | null
          old_values: Json
          reason: string | null
        }
        Insert: {
          change_date: string
          change_type: string
          created_at?: string
          created_by?: string | null
          entity_id: number
          entity_type: string
          id?: string
          new_parent_id?: number | null
          new_values?: Json
          old_parent_id?: number | null
          old_values?: Json
          reason?: string | null
        }
        Update: {
          change_date?: string
          change_type?: string
          created_at?: string
          created_by?: string | null
          entity_id?: number
          entity_type?: string
          id?: string
          new_parent_id?: number | null
          new_values?: Json
          old_parent_id?: number | null
          old_values?: Json
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_hierarchy_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          address_id: string | null
          created_at: string
          director_employee_id: number | null
          gl_code: string | null
          id: string
          is_active: boolean
          market_id: number
          metadata: Json
          name: string
          region_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          director_employee_id?: number | null
          gl_code?: string | null
          id?: string
          is_active?: boolean
          market_id: number
          metadata?: Json
          name: string
          region_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string
          director_employee_id?: number | null
          gl_code?: string | null
          id?: string
          is_active?: boolean
          market_id?: number
          metadata?: Json
          name?: string
          region_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_regions_director"
            columns: ["director_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_regions_director"
            columns: ["director_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_regions_director"
            columns: ["director_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "fk_regions_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regions_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "regions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["market_id"]
          },
          {
            foreignKeyName: "regions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["market_id"]
          },
        ]
      }
      termination_reasons: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          reason_code: string
          reason_type: string
          requires_details: boolean
          termination_reason_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          reason_code: string
          reason_type: string
          requires_details?: boolean
          termination_reason_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          reason_code?: string
          reason_type?: string
          requires_details?: boolean
          termination_reason_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          permissions: Json
          row_level_security_config: Json
          updated_at: string
          user_type_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          permissions?: Json
          row_level_security_config?: Json
          updated_at?: string
          user_type_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          permissions?: Json
          row_level_security_config?: Json
          updated_at?: string
          user_type_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      active_concurrent_assignments: {
        Row: {
          assignment_count: number | null
          assignment_types: string[] | null
          email: string | null
          employee_id: number | null
          first_name: string | null
          last_name: string | null
          location_names: string[] | null
          primary_count: number | null
          secondary_count: number | null
        }
        Relationships: []
      }
      current_employee_locations: {
        Row: {
          assignment_type: string | null
          district_id: number | null
          district_name: string | null
          email: string | null
          employee_active: boolean | null
          employee_id: number | null
          first_name: string | null
          is_primary: boolean | null
          job_title: string | null
          job_title_id: number | null
          last_name: string | null
          location_id: number | null
          location_name: string | null
          market_id: number | null
          market_name: string | null
          region_id: number | null
          region_name: string | null
          start_date: string | null
          store_number: string | null
          supervisor_employee_id: number | null
          supervisor_first_name: string | null
          supervisor_last_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignments_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["job_title_id"]
          },
          {
            foreignKeyName: "employee_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "employee_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employee_assignment_timeline: {
        Row: {
          assignment_type: string | null
          employee_id: number | null
          end_date: string | null
          first_name: string | null
          is_current: boolean | null
          is_primary: boolean | null
          job_title: string | null
          job_title_id: number | null
          last_name: string | null
          location_id: number | null
          location_name: string | null
          notes: string | null
          reason_code: string | null
          start_date: string | null
          supervisor_employee_id: number | null
          supervisor_first_name: string | null
          supervisor_last_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["job_title_id"]
          },
          {
            foreignKeyName: "employee_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_employee_counts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "employee_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "active_concurrent_assignments"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_assignments_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      location_employee_counts: {
        Row: {
          district_id: number | null
          district_name: string | null
          location_id: number | null
          location_name: string | null
          market_id: number | null
          market_name: string | null
          primary_count: number | null
          region_id: number | null
          region_name: string | null
          secondary_count: number | null
          total_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "current_employee_locations"
            referencedColumns: ["district_id"]
          },
          {
            foreignKeyName: "locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_id"]
          },
        ]
      }
      org_structure_tree: {
        Row: {
          district_id: number | null
          entity_id: number | null
          entity_name: string | null
          level_depth: number | null
          level_type: string | null
          location_id: number | null
          market_id: number | null
          parent_id: number | null
          region_id: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
