import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, Save, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { fetchAiSettings, saveAiSettings } from '../../api/aiSettings'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const INPUT =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]'

export default function AiSettingsAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  const [view, setView] = useState(null)
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchAiSettings()
      .then((data) => {
        setView(data)
        setProvider(data.provider)
        setModel(data.model)
      })
      .catch((err) => {
        if (err.status === 401) {
          logout()
          navigate('/rnl-panel/login')
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [logout, navigate])

  const vendors = view?.vendors ?? []
  const selected = vendors.find((v) => v.name === provider)

  // Switching vendor clears a model name that belonged to the previous one:
  // "gpt-5-nano" on Qwen would be a 404, and the blank field means "vendor
  // default", which is always valid.
  const pickProvider = (name) => {
    setProvider(name)
    setModel('')
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const next = await saveAiSettings({ provider, model })
      setView(next)
      setProvider(next.provider)
      setModel(next.model)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-1">
        <Cpu size={20} className="text-[#448834]" />
        <h1 className="text-xl font-bold text-gray-900">AI provider</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        One provider is active at a time. It serves the chatbot, the Instagram
        auto-fill and every blog generation. Changes take effect within a minute
        — no redeploy, no restart.
      </p>

      {view?.fallbackReason && (
        <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-5">
          <AlertCircle size={14} className="shrink-0 mt-px" />
          <span>
            Currently running on <strong>{view.effectiveProvider}</strong> instead:{' '}
            {view.fallbackReason}
          </span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Active provider</p>

          {vendors.map((vendor) => {
            const active = vendor.name === provider
            return (
              <label
                key={vendor.name}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  active ? 'border-[#448834] bg-[#448834]/5' : 'border-gray-200 hover:bg-gray-50'
                } ${vendor.keyConfigured ? '' : 'opacity-60'}`}
              >
                <input
                  type="radio"
                  name="provider"
                  className="mt-1 accent-[#448834]"
                  checked={active}
                  onChange={() => pickProvider(vendor.name)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{vendor.label}</span>
                    {vendor.keyConfigured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#448834]">
                        <CheckCircle2 size={11} /> key set
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-600">
                        <KeyRound size={11} /> no key
                      </span>
                    )}
                    {vendor.strictJson && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">strict json</span>
                    )}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">{vendor.note}</span>
                  <span className="block text-[11px] text-gray-400 mt-1 font-mono break-all">
                    default: {vendor.defaultModel || '—'}
                  </span>
                </span>
              </label>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700 mb-1.5">
            Model
          </label>
          <input
            id="ai-model"
            value={model}
            onChange={(e) => {
              setModel(e.target.value)
              setSaved(false)
            }}
            className={INPUT}
            placeholder={selected?.defaultModel || 'vendor default'}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Leave empty to use <span className="font-mono">{selected?.defaultModel || 'the vendor default'}</span>.
            Model ids change often — paste a new one here rather than waiting for a release.
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-[#448834] font-medium">Saved</span>}
          {view && (
            <span className="ml-auto text-xs text-gray-400 font-mono">
              live: {view.effectiveProvider} / {view.effectiveModel}
            </span>
          )}
        </div>
      </form>
    </main>
  )
}
