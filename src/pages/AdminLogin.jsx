import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('') // Clear previous errors

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Success - redirect or whatever you do next
      navigate('/admin/dashboard') // or wherever

    } catch (err) {
      setError(err.message || 'Failed to login')
    }
  }
  return (
    // Full screen height, warm background, centers everything vertically and horizontally
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-6">

      {/* Container to keep it narrow and readable on mobile */}
      <div className="w-full max-w-sm">

        {/* Header / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Baked Sushi</h1>
          <p className="text-gray-500 mt-2 text-sm">Admin Portal</p>
        </div>

        {/* The Login Card */}
        <div className="bg-white p-8 rounded-2xl shadow-soft">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="admin@bakedsushi.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error Message (If you have an error state, display it here) */}
            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full py-3 text-base font-semibold mt-2"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}