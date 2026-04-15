import { useState } from 'react'
import { AlertTriangle, User, Lock, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err.message?.includes('401') ? 'Incorrect username or password' : 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-dark-800 border border-dark-700 rounded-3xl p-8 shadow-2xl">

          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <AlertTriangle size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-100 tracking-tight">Findings Management</h1>
            <p className="text-sm text-gray-500 mt-1">PT Charoen Pokphand Indonesia</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Username</label>
              <div className={`flex items-center gap-3 bg-dark-900 border rounded-xl px-4 py-3 transition ${error ? 'border-red-500/50' : 'border-dark-700 focus-within:border-indigo-500/60'}`}>
                <User size={17} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  placeholder="Enter username"
                  className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-600"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className={`flex items-center gap-3 bg-dark-900 border rounded-xl px-4 py-3 transition ${error ? 'border-red-500/50' : 'border-dark-700 focus-within:border-indigo-500/60'}`}>
                <Lock size={17} className="text-gray-500 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter password"
                  className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-600"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-600 hover:text-gray-400 transition shrink-0">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle size={15} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white font-semibold py-3 rounded-xl transition text-sm mt-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                : <><LogIn size={17} />Sign In</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          © {new Date().getFullYear()} PT Charoen Pokphand Indonesia
        </p>
      </div>
    </div>
  )
}
