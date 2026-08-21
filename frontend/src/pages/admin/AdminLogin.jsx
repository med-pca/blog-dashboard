import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { login, verify2FA } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import Logo from '../../components/Logo'

export default function AdminLogin() {
  const { saveToken } = useAdminAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('credentials') // 'credentials' | '2fa'
  const [form, setForm] = useState({
    username: localStorage.getItem('admin_remember_user') || '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(!!localStorage.getItem('admin_remember_user'))
  const [preAuthToken, setPreAuthToken] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)

  const otpInputRef = useRef(null)

  useEffect(() => {
    if (step === '2fa') otpInputRef.current?.focus()
  }, [step])

  const handleRateLimit = () => {
    setRateLimited(true)
    setError('Too many failed attempts. Wait one minute and try again.')
    setTimeout(() => { setRateLimited(false); setError('') }, 60000)
  }

  const handleCredentials = async (e) => {
    e.preventDefault()
    if (rateLimited) return
    setError('')
    setLoading(true)
    try {
      const data = await login(form.username, form.password, remember)
      if (data.requires2fa) {
        setPreAuthToken(data.preAuthToken)
        setStep('2fa')
      } else {
        if (remember) localStorage.setItem('admin_remember_user', form.username)
        else localStorage.removeItem('admin_remember_user')
        saveToken()
        navigate('/rnl-panel')
      }
    } catch (err) {
      if (err.status === 429) handleRateLimit()
      else setError('Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    if (rateLimited) return
    setError('')
    setLoading(true)
    try {
      await verify2FA(preAuthToken, otpCode)
      if (remember) localStorage.setItem('admin_remember_user', form.username)
      else localStorage.removeItem('admin_remember_user')
      saveToken()
      navigate('/rnl-panel')
    } catch (err) {
      if (err.status === 429) handleRateLimit()
      else {
        setError('Invalid code. Try again.')
        setOtpCode('')
        otpInputRef.current?.focus()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="h-24 w-auto" />
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-[#448834]"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full bg-[#448834] hover:bg-[#357228] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : rateLimited ? 'Please wait...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="flex flex-col items-center text-center mb-2">
              <div className="bg-[#448834]/10 rounded-full p-3 mb-3">
                <ShieldCheck size={24} className="text-[#448834]" />
              </div>
              <p className="text-sm font-medium text-gray-800">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400 mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>

            <div>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading || rateLimited || otpCode.length !== 6}
              className="w-full bg-[#448834] hover:bg-[#357228] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : rateLimited ? 'Please wait...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); setOtpCode('') }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Go back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
