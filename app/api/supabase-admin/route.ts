import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simplified version to avoid type instantiation issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, params } = body

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let result: any;

    switch (type) {
      case 'query':
        // Raw SQL query - disabled for safety
        return NextResponse.json({ 
          error: 'Raw SQL queries are disabled for safety' 
        }, { status: 400 })
      
      case 'select':
        // Select data - use type assertion to avoid deep instantiation
        const { from, select, filter } = params
        result = await (supabaseAdmin as any).from(from).select(select || '*')
        break
      
      case 'insert':
        // Insert data
        result = await (supabaseAdmin as any).from(params.table).insert(params.data)
        break
      
      case 'update':
        // Update data
        result = await (supabaseAdmin as any)
          .from(params.table)
          .update(params.data)
          .eq(params.match?.column || 'id', params.match?.value)
        break
      
      case 'delete':
        // Delete data
        result = await (supabaseAdmin as any)
          .from(params.table)
          .delete()
          .eq(params.match?.column || 'id', params.match?.value)
        break
      
      case 'function':
        // Call database function
        result = await (supabaseAdmin as any).rpc(params.name, params.args)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 })
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result?.data || result })
  } catch (error) {
    console.error('Supabase admin error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}