import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240130000002_fix_rls_policies.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    // Split by semicolons but be careful with functions
    const statements = migrationSQL
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';')

    const results = []
    
    for (const statement of statements) {
      try {
        // Skip comments
        if (statement.trim().startsWith('--')) continue
        
        console.log('Executing:', statement.substring(0, 50) + '...')
        
        // Execute the statement using raw SQL
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error('Statement error:', error)
          results.push({ statement: statement.substring(0, 100), error: error.message })
        } else {
          results.push({ statement: statement.substring(0, 100), success: true })
        }
      } catch (err: any) {
        results.push({ statement: statement.substring(0, 100), error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration attempted',
      results
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to apply migration' 
      },
      { status: 500 }
    )
  }
}