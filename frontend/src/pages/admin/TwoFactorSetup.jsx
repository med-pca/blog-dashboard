import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ShieldOff, CheckCircle } from 'lucide-react'
import { generate2FASetup, confirm2FASetup, get2FAStatus, remove2FA } from '../../api/admin'

export default function TwoFactorSetup() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null) // { enabled: bool }
  const [setup, setSetup] = useState(null)   // { secret, qrCodeUrl }
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [removeCode, setRemoveCode] = useState('')
  const [removePassword, setRemovePassword] = useState('')

  useEffect(() => {
    get2FAStatus().then(setStatus).catch(() => navigate('/rnl-panel'))
  }, [navigate])

  const startSetup = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await generate2FASetup()
      setSetup(data)
    } catch {
      setError('Could not generate the QR code.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirm2FASetup(setup.secret, code)
      setSuccess('2FA enabled successfully!')
      setSetup(null)
      setCode('')
      setStatus({ enabled: true })
    } catch (err) {
      setError(err.message)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await remove2FA(removeCode, removePassword)
      setStatus({ enabled: false })
      setSetup(null)
      setRemoveMode(false)
      setRemoveCode('')
      setRemovePassword('')
      setSuccess('2FA has been disabled.')
    } catch (err) {
      setError(err.message || 'Could not remove 2FA.')
      setRemoveCode('')
    } finally {
      setLoading(false)
    }
  }

  if (!status) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <main className="max-w-lg mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h1>
        <p className="text-sm text-gray-400 mt-0.5">Protect your account with an authenticator app</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Mevcut durum */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status.enabled
            ? <ShieldCheck size={20} className="text-[#448834]" />
            : <ShieldOff size={20} className="text-gray-400" />
          }
          <div>
            <p className="text-sm font-medium text-gray-800">
              {status.enabled ? '2FA Active' : '2FA Disabled'}
            </p>
            <p className="text-xs text-gray-400">
              {status.enabled ? 'A code is required at sign-in' : 'Your account has no extra protection'}
            </p>
          </div>
        </div>
        {status.enabled ? (
          <button
            onClick={() => { setRemoveMode(true); setError('') }}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-40"
          >
            Disable
          </button>
        ) : !setup && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="text-sm text-[#448834] hover:text-[#357228] font-medium disabled:opacity-40"
          >
            {loading ? 'Loading...' : 'Enable'}
          </button>
        )}
      </div>

      {/* 2FA removal — code verification */}
      {removeMode && (
        <div className="bg-white border border-red-100 rounded-xl p-6 space-y-4 mb-6">
          <p className="text-sm font-semibold text-gray-800">Enter your password and authenticator code to disable 2FA</p>
          <form onSubmit={handleRemove} className="space-y-3">
            <input
              type="password"
              value={removePassword}
              onChange={(e) => setRemovePassword(e.target.value)}
              placeholder="Your current password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              required
              autoFocus
              autoComplete="current-password"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={removeCode}
              onChange={(e) => setRemoveCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              required
            />
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setRemoveMode(false); setRemoveCode(''); setRemovePassword(''); setError('') }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || removeCode.length !== 6 || !removePassword}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Removing...' : 'Disable'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Setup flow */}
      {setup && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">1. Scan the QR code</p>
            <p className="text-xs text-gray-400 mb-4">Use Google Authenticator, Authy or a similar app</p>
            <div className="flex justify-center">
              <img src={setup.qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-gray-100" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Manual entry code</p>
            <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg text-gray-700 tracking-widest text-center select-all">
              {setup.secret}
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">2. Uygulamadaki kodu girin</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setSetup(null); setError(''); setCode('') }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 bg-[#448834] hover:bg-[#357228] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Verifying...' : 'Onayla'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
