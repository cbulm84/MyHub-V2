import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Only enable this in development!
const isDevelopment = process.env.NODE_ENV === 'development'

export async function POST(request: NextRequest) {
  if (!isDevelopment) {
    return NextResponse.json({ error: 'Admin API only available in development' }, { status: 403 })
  }

  try {
    const { query, type, params } = await request.json()
    
    // Use service role key for admin access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to .env.local
    )

    let result;

    switch (type) {
      case 'query':
        // Raw SQL query
        result = await supabaseAdmin.rpc('exec_sql', { query })
        break
      
      case 'select':
        // Select data
        const { from, select, filter } = params
        let query = supabaseAdmin.from(from).select(select || '*')
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        result = await query
        break
      
      case 'insert':
        // Insert data
        result = await supabaseAdmin.from(params.table).insert(params.data)
        break
      
      case 'update':
        // Update data
        result = await supabaseAdmin.from(params.table).update(params.data).eq(params.match.column, params.match.value)
        break
      
      case 'delete':
        // Delete data
        result = await supabaseAdmin.from(params.table).delete().eq(params.match.column, params.match.value)
        break
      
      case 'function':
        // Call database function
        result = await supabaseAdmin.rpc(params.name, params.args)
        break

      default:
        return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper endpoint to check if admin API is available
export async function GET() {
  return NextResponse.json({ 
    enabled: isDevelopment,
    message: isDevelopment ? 'Admin API is available' : 'Admin API is disabled in production'
  })
}