'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type UserType = Database['public']['Tables']['user_types']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  employee: Employee | null
  userType: UserType | null
  loading: boolean
  error: AuthError | Error | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshEmployee: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | Error | null>(null)
  
  // Create Supabase client
  const supabase = createClient()

  const clearError = () => setError(null)

  const fetchEmployeeData = async (userId: string) => {
    try {
      console.log('Fetching employee data for user:', userId)
      
      // Get employee record
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      if (empError) {
        console.error('Error fetching employee:', empError)
        setError(new Error(`Failed to fetch employee data: ${empError.message}`))
        return
      }

      setEmployee(empData)

      // Get user type
      if (empData?.user_type_id) {
        const { data: typeData } = await supabase
          .from('user_types')
          .select('*')
          .eq('user_type_id', empData.user_type_id)
          .single()
        
        if (typeData) {
          setUserType(typeData)
        }
      }
      
      console.log('Employee data fetched successfully')
    } catch (error) {
      console.error('Error in fetchEmployeeData:', error)
      setError(error as Error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Session found, user:', session.user.email)
          setSession(session)
          setUser(session.user)
          await fetchEmployeeData(session.user.id)
        } else {
          console.log('No session found')
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setError(error as Error)
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session)
        setUser(session.user)
        await fetchEmployeeData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setEmployee(null)
        setUserType(null)
        // Middleware will handle redirect to login
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { error: authError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setError(error as Error)
    }
  }

  const refreshEmployee = async () => {
    if (user?.id) {
      await fetchEmployeeData(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      employee,
      userType,
      loading,
      error,
      signIn,
      signOut,
      refreshEmployee,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}