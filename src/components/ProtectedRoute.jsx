import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p>Loading...</p>

  // If not logged in, redirect to login page
  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  // If logged in, show the page
  return children
}