import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ShieldOff, CheckCircle, User, Lock, Eye, EyeOff, ChevronRight, ArrowLeft,
} from 'lucide-react'
import {
  generate2FASetup, confirm2FASetup, get2FAStatus, remove2FA, changeCredentials,
} from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

// ── Small helper components ───────────────────────────────────────────────

function SuccessMsg({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
      <CheckCircle size={15} /> {msg}
    </div>
  )
}

function ErrorMsg({ msg }) {
  return <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{msg}</p>
}

function PasswordInput({ value, onChange, placeholder, autoComplete, required = true }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
      />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

// ── Account details component ─────────────────────────────────────────────

function HesapBilgileri({ twoFaEnabled, onDone }) {
  // step: 'select' | 'form' | '2fa'
  const [step, setStep] = useState('select')
  const [type, setType] = useState(null) // 'username' | 'password'

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setStep('select')
    setType(null)
    setNewUsername('')
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPassword('')
    setOtpCode('')
    setError('')
  }

  const handleSelect = (t) => {
    setType(t)
    setError('')
    setStep('form')
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (type === 'password') {
      if (newPassword !== confirmPassword) {
        setError('The new passwords do not match')
        return
      }
      if (newPassword.length < 8) {
        setError('The password must be at least 8 characters')
        return
      }
    }
    if (twoFaEnabled) {
      setStep('2fa')
    } else {
      doChange()
    }
  }

  const doChange = async (code) => {
    setError('')
    setLoading(true)
    try {
      await changeCredentials({
        currentPassword,
        newUsername: type === 'username' ? newUsername : undefined,
        newPassword: type === 'password' ? newPassword : undefined,
        totpCode: code,
      })
      onDone()
    } catch (err) {
      setError(err.message)
      if (twoFaEnabled) setStep('2fa')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = (e) => {
    e.preventDefault()
    if (otpCode.length !== 6) return
    doChange(otpCode)
  }

  // ── Select ──
  if (step === 'select') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => handleSelect('username')}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <User size={18} className="text-[#448834]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Username</p>
              <p className="text-xs text-gray-400">The name you use to sign in</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        <button
          onClick={() => handleSelect('password')}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-[#448834]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Password</p>
              <p className="text-xs text-gray-400">Your account password</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>
    )
  }

  // ── Form ──
  if (step === 'form') {
    return (
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <button type="button" onClick={reset}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
          <ArrowLeft size={14} /> Back
        </button>

        <p className="text-sm font-semibold text-gray-700">
          {type === 'username' ? 'Change Username' : 'Change Password'}
        </p>

        {type === 'username' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">New Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="yeni_kullanici"
              minLength={3} maxLength={50}
              pattern="[a-zA-Z0-9_-]+"
              autoComplete="off"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
            />
          </div>
        )}

        {type === 'password' && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Password</label>
              <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="En az 8 karakter" autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Password (Repeat)</label>
              <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter the password" autoComplete="new-password" />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">Current Password</label>
          <PasswordInput value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Your current password" autoComplete="current-password" />
        </div>

        {error && <ErrorMsg msg={error} />}

        <button type="submit"
          className="w-full bg-[#448834] hover:bg-[#357228] text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
          {twoFaEnabled ? 'Devam Et' : 'Change'}
        </button>
      </form>
    )
  }

  // ── 2FA ──
  if (step === '2fa') {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-5">
        <button type="button" onClick={() => { setStep('form'); setOtpCode(''); setError('') }}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[#448834]/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={26} className="text-[#448834]" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
          <p className="text-xs text-gray-400 mt-1">
            Enter the authenticator code to confirm the change
          </p>
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={otpCode}
          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          required
          autoFocus
          className="w-full border border-gray-200 rounded-lg px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
        />

        {error && <ErrorMsg msg={error} />}

        <button type="submit"
          disabled={loading || otpCode.length !== 6}
          className="w-full bg-[#448834] hover:bg-[#357228] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
          {loading ? 'Verifying...' : 'Confirm and Change'}
        </button>
      </form>
    )
  }
}

// ── Ana Sayfa ──────────────────────────────────────────────────────────────

export default function Guvenlik() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [twoFaStatus, setTwoFaStatus] = useState(null)
  const [setup, setSetup] = useState(null)
  const [tfaCode, setTfaCode] = useState('')
  const [tfaError, setTfaError] = useState('')
  const [tfaSuccess, setTfaSuccess] = useState('')
  const [tfaLoading, setTfaLoading] = useState(false)
  const [credSuccess, setCredSuccess] = useState('')
  const [removeMode, setRemoveMode] = useState(false)
  const [removeCode, setRemoveCode] = useState('')
  const [removePassword, setRemovePassword] = useState('')

  useEffect(() => {
    get2FAStatus().then(setTwoFaStatus).catch(() => navigate('/rnl-panel'))
  }, [navigate])

  const handleCredentialDone = () => {
    setCredSuccess('Credentials changed. Please sign in again...')
    setTimeout(() => { logout(); navigate('/rnl-panel/login') }, 2000)
  }

  const startSetup = async () => {
    setTfaError('')
    setTfaLoading(true)
    try { setSetup(await generate2FASetup()) }
    catch { setTfaError('Could not generate the QR code.') }
    finally { setTfaLoading(false) }
  }

  const handleConfirm2FA = async (e) => {
    e.preventDefault()
    setTfaError('')
    setTfaLoading(true)
    try {
      await confirm2FASetup(setup.secret, tfaCode)
      setTfaSuccess('2FA enabled successfully!')
      setSetup(null)
      setTfaCode('')
      setTwoFaStatus({ enabled: true })
    } catch (err) {
      setTfaError(err.message)
      setTfaCode('')
    } finally { setTfaLoading(false) }
  }

  const handleRemove2FA = async (e) => {
    e.preventDefault()
    setTfaLoading(true)
    setTfaError('')
    try {
      await remove2FA(removeCode, removePassword)
      setTwoFaStatus({ enabled: false })
      setSetup(null)
      setRemoveMode(false)
      setRemoveCode('')
      setRemovePassword('')
      setTfaSuccess('2FA has been disabled.')
    } catch (err) {
      setTfaError(err.message || 'Could not remove 2FA.')
      setRemoveCode('')
    } finally { setTfaLoading(false) }
  }

  if (!twoFaStatus) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <main className="max-w-lg mx-auto px-6 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Security</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and sign-in settings</p>
      </div>

      {credSuccess && <SuccessMsg msg={credSuccess} />}

      {/* Hesap Bilgileri */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-800">Change Account Details</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {twoFaStatus.enabled ? 'Changes are confirmed with a 2FA code' : 'Current password confirmation is required'}
          </p>
        </div>
        <div className="px-6 py-5">
          <HesapBilgileri
            twoFaEnabled={twoFaStatus.enabled}
            onDone={handleCredentialDone}
          />
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
            <p className="text-xs text-gray-400 mt-0.5">Protect your account with an authenticator app</p>
          </div>
          {twoFaStatus.enabled
            ? <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
            : <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Disabled</span>
          }
        </div>

        <div className="px-6 py-5 space-y-4">
          {tfaSuccess && <SuccessMsg msg={tfaSuccess} />}

          <div className="flex items-center gap-3">
            {twoFaStatus.enabled
              ? <ShieldCheck size={20} className="text-[#448834]" />
              : <ShieldOff size={20} className="text-gray-300" />
            }
            <p className="text-sm text-gray-600">
              {twoFaStatus.enabled
                ? 'A 6-digit code is required at sign-in'
                : 'Your account has no extra protection'}
            </p>
          </div>

          {!setup && !removeMode && (
            twoFaStatus.enabled
              ? <button onClick={() => { setRemoveMode(true); setTfaError('') }} disabled={tfaLoading}
                  className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-40">
                  Disable
                </button>
              : <button onClick={startSetup} disabled={tfaLoading}
                  className="w-full bg-[#448834] hover:bg-[#357228] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
                  {tfaLoading ? 'Loading...' : 'Enable 2FA'}
                </button>
          )}

          {removeMode && (
            <form onSubmit={handleRemove2FA} className="space-y-3 border-t border-gray-50 pt-4">
              <p className="text-sm font-semibold text-gray-800">
                Enter your password and authenticator code to disable it
              </p>
              <input
                type="password" autoComplete="current-password" required autoFocus
                value={removePassword} onChange={e => setRemovePassword(e.target.value)}
                placeholder="Your current password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              />
              <input
                type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                value={removeCode} onChange={e => setRemoveCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              />
              {tfaError && <ErrorMsg msg={tfaError} />}
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setRemoveMode(false); setRemoveCode(''); setRemovePassword(''); setTfaError('') }}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit"
                  disabled={tfaLoading || removeCode.length !== 6 || !removePassword}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
                  {tfaLoading ? 'Removing...' : 'Disable'}
                </button>
              </div>
            </form>
          )}

          {setup && (
            <div className="space-y-4 border-t border-gray-50 pt-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">1. Scan the QR code</p>
                <p className="text-xs text-gray-400 mb-3">Use Google Authenticator or Authy</p>
                <div className="flex justify-center">
                  <img src={setup.qrCodeUrl} alt="QR Code" className="w-44 h-44 rounded-xl border border-gray-100" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Manual entry code</p>
                <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg text-gray-700 tracking-widest text-center select-all">
                  {setup.secret}
                </p>
              </div>
              <form onSubmit={handleConfirm2FA} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">2. Verify the code</p>
                  <input
                    type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                    value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" required autoFocus
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                  />
                </div>
                {tfaError && <ErrorMsg msg={tfaError} />}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setSetup(null); setTfaError(''); setTfaCode('') }}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={tfaLoading || tfaCode.length !== 6}
                    className="flex-1 bg-[#448834] hover:bg-[#357228] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm">
                    {tfaLoading ? 'Verifying...' : 'Onayla'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tfaError && !setup && <ErrorMsg msg={tfaError} />}
        </div>
      </div>
    </main>
  )
}
