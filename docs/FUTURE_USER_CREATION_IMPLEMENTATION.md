# Future User Creation System Implementation Plan

## Overview
This document outlines the implementation plan for a user creation system to be added in future iterations. Currently, employee data is piped in from external systems, so this functionality is not immediately needed but will be valuable for future bidirectional sync capabilities.

## Option 1: Application-Level Sync (RECOMMENDED FOR YOUR USE CASE)
**Best for: Systems with external data sources and future bidirectional sync needs**

### Implementation Code

```typescript
// lib/auth-sync.ts
import { createServerClient } from '@/lib/supabase/server'

export async function createEmployeeWithAuth(employeeData: {
  email: string
  first_name: string
  last_name: string
  employee_number: string
  user_type_id: number
  // ... other fields
}) {
  const supabase = await createServerClient()
  
  // Generate temporary password
  const tempPassword = `Welcome${new Date().getFullYear()}!`
  
  try {
    // 1. Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin
      .createUser({
        email: employeeData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: employeeData.first_name,
          last_name: employeeData.last_name
        }
      })
    
    if (authError) throw authError
    
    // 2. Create employee with auth UID
    const { data: employee, error: dbError } = await supabase
      .from('employees')
      .insert({
        ...employeeData,
        auth_user_id: authData.user.id
      })
      .select()
      .single()
    
    if (dbError) {
      // Rollback: delete auth user if employee creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw dbError
    }
    
    return { 
      employee, 
      authUser: authData.user,
      tempPassword 
    }
  } catch (error) {
    console.error('Failed to create employee with auth:', error)
    throw error
  }
}

// Handle employee status changes
export async function updateEmployeeStatus(
  employeeId: number, 
  isActive: boolean
) {
  const supabase = await createServerClient()
  
  // Get employee with auth UID
  const { data: employee } = await supabase
    .from('employees')
    .select('auth_user_id')
    .eq('employee_id', employeeId)
    .single()
  
  if (employee?.auth_user_id) {
    // Update auth user status
    await supabase.auth.admin.updateUserById(
      employee.auth_user_id,
      { banned_until: isActive ? null : 'infinity' }
    )
  }
  
  // Update employee record
  await supabase
    .from('employees')
    .update({ is_active: isActive })
    .eq('employee_id', employeeId)
}
```

### Form Implementation
```typescript
// In your new employee page
const handleSubmit = async (formData) => {
  try {
    const { employee, tempPassword } = await createEmployeeWithAuth(formData)
    
    // Show success with temp password
    alert(`Employee created! Temporary password: ${tempPassword}`)
    router.push(`/employees/${employee.employee_id}`)
  } catch (error) {
    setError(error.message)
  }
}
```

## Option 2: Database Triggers + Background Processing
**Best for: High-volume systems with async processing needs**

### Background Job Implementation
```javascript
// Background job to process auth sync queue
async function processAuthSyncQueue() {
  const { data: syncTasks } = await supabase
    .from('integration_sync_log')
    .select('*')
    .eq('system_name', 'SUPABASE_AUTH')
    .eq('status', 'PENDING')
    .order('created_at');

  for (const task of syncTasks) {
    try {
      const requestData = task.request_data;
      
      switch (requestData.action) {
        case 'disable_auth_user':
          await supabase.auth.admin.updateUserById(
            requestData.auth_user_id,
            { banned_until: 'infinity' }
          );
          break;
          
        case 'enable_auth_user':
          await supabase.auth.admin.updateUserById(
            requestData.auth_user_id,
            { banned_until: null }
          );
          break;
          
        case 'update_auth_email':
          await supabase.auth.admin.updateUserById(
            requestData.auth_user_id,
            { email: requestData.new_email }
          );
          break;
      }

      // Mark as completed
      await supabase
        .from('integration_sync_log')
        .update({ 
          status: 'SUCCESS',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

    } catch (error) {
      await supabase
        .from('integration_sync_log')
        .update({ 
          status: 'FAILED',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);
    }
  }
}
```

## Option 3: Real-time Sync with Webhooks
**Best for: Systems requiring immediate sync and external integrations**

### Webhook Handler
```javascript
// Webhook handler for auth events
app.post('/webhook/auth', async (req, res) => {
  const { type, record } = req.body;
  
  switch (type) {
    case 'INSERT':
      // New auth user created - link to employee if needed
      await linkAuthUserToEmployee(record);
      break;
      
    case 'UPDATE':
      // Auth user updated - sync changes to employee
      await syncAuthUserToEmployee(record);
      break;
      
    case 'DELETE':
      // Auth user deleted - mark employee as needing new auth
      await handleAuthUserDeletion(record);
      break;
  }
  
  res.status(200).json({ success: true });
});
```

## Monitoring Dashboard Component
```typescript
// app/(authenticated)/admin/auth-sync/page.tsx
export default async function AuthSyncPage() {
  const supabase = await createServerClient()
  
  // Get sync summary
  const { data: syncSummary } = await supabase
    .rpc('get_auth_sync_summary')
  
  // Get recent failures
  const { data: failures } = await supabase
    .from('integration_sync_log')
    .select('*')
    .eq('system_name', 'SUPABASE_AUTH')
    .eq('status', 'FAILED')
    .order('created_at', { ascending: false })
    .limit(10)
  
  return (
    <div className="p-6">
      <h1>Auth Sync Status</h1>
      {/* Display sync status dashboard */}
    </div>
  )
}
```

## Utility SQL Functions for Maintenance
```sql
-- Check sync status
SELECT * FROM get_auth_sync_summary();

-- Find employees without auth UIDs (should be rare)
SELECT * FROM find_employees_without_auth();

-- Monitor recent sync activities
SELECT * FROM recent_auth_sync_log WHERE status = 'FAILED' LIMIT 10;

-- Check for auth sync issues
SELECT * FROM auth_sync_monitor 
WHERE sync_status IN ('MISSING_AUTH_UID', 'INACTIVE_WITH_AUTH')
LIMIT 20;
```

## Important Considerations
- **Service Role Required**: Direct auth.users table access requires Supabase service role
- **Rate Limiting**: Batch operations should respect API rate limits
- **Error Handling**: Always implement robust error handling and rollback mechanisms
- **Audit Trail**: The integration_sync_log table provides full audit trail
- **Security**: Never expose auth management functions to client-side code

## Future Expansion Notes
- This system is designed to coexist with external data imports
- Can be extended for bidirectional sync with external vendors
- Authentication UIDs are maintained automatically through database triggers
- Consider implementing rate limiting for bulk operations
- Add email notifications for failed sync operations