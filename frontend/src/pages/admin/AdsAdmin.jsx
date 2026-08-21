import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Save, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react'
import { fetchAdsSettings, saveAdsSettings, EMPTY_SLOTS } from '../../api/ads'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const CLIENT_ID_PATTERN = /^ca-pub-\d{16}$/
const SLOT_PATTERN = /^\d{6,20}$/

// Mirrors the placements the public site renders; the copy explains where each
// unit shows up so slots are not pasted into the wrong box.
const PLACEMENTS = [
  {
    key: 'blogList',
    label: 'Blog list',
    where: 'Between the cards on the Blog page',
    hint: 'A wide banner works best here.',
  },
  {
    key: 'blogArticleTop',
    label: 'Article — top',
    where: 'Under the header of a blog post, before the text',
    hint: 'Highest visibility placement.',
  },
  {
    key: 'blogArticleBottom',
    label: 'Article — bottom',
    where: 'At the end of a blog post, before the related posts',
    hint: 'Good for readers who finish the article.',
  },
  {
    key: 'recipeDetail',
    label: 'Recipe detail',
    where: 'Inside a recipe guide page, after the intro',
    hint: 'Leave empty to keep recipe pages ad-free.',
  },
]

const INPUT =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]'

export default function AdsAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ enabled: false, clientId: '', slots: { ...EMPTY_SLOTS } })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchAdsSettings()
      .then((data) => setForm({ ...data, slots: { ...EMPTY_SLOTS, ...data.slots } }))
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

  const setSlot = (key, value) =>
    setForm((f) => ({ ...f, slots: { ...f.slots, [key]: value.trim() } }))

  const clientIdValid = !form.clientId || CLIENT_ID_PATTERN.test(form.clientId)
  const invalidSlots = PLACEMENTS.filter(
    (p) => form.slots[p.key] && !SLOT_PATTERN.test(form.slots[p.key]),
  )
  const filledSlots = PLACEMENTS.filter((p) => form.slots[p.key]).length
  const canSave = clientIdValid && invalidSlots.length === 0 && !saving

  // The publisher id without the "ca-" prefix is what ads.txt expects.
  const adsTxtLine = form.clientId
    ? `google.com, ${form.clientId.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0`
    : ''

  const copyAdsTxt = async () => {
    try {
      await navigator.clipboard.writeText(adsTxtLine)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Permission denied or old browser — fail silently, the text stays selectable
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const next = await saveAdsSettings(form)
      setForm({ ...next, slots: { ...EMPTY_SLOTS, ...next.slots } })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-1">
        <Megaphone size={20} className="text-[#448834]" />
        <h1 className="text-xl font-bold text-gray-900">Google AdSense</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Paste your publisher id and ad unit slots here. Changes go live on the
        site immediately — no redeploy needed.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Master switch */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                form.enabled ? 'bg-[#448834]' : 'bg-gray-200'
              }`}
              aria-label="Toggle ads"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {form.enabled ? 'Ads are on' : 'Ads are off'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.enabled
                  ? `${filledSlots} of ${PLACEMENTS.length} placements filled in`
                  : 'The AdSense script is not loaded for visitors while this is off.'}
              </p>
            </div>
          </div>

          {form.enabled && !form.clientId && (
            <p className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-4">
              <AlertCircle size={14} className="shrink-0 mt-px" />
              Ads stay hidden until a publisher id is filled in below.
            </p>
          )}
        </div>

        {/* Publisher id */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Publisher ID
          </label>
          <input
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value.trim() }))}
            className={INPUT}
            placeholder="ca-pub-1234567890123456"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Found in AdSense under Account → Settings → Account information.
          </p>
          {!clientIdValid && (
            <p className="text-xs text-red-500 mt-1.5">
              Must look like ca-pub- followed by 16 digits.
            </p>
          )}
        </div>

        {/* Slots */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-800">Ad placements</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste the numeric slot id of an ad unit. Leave a box empty to hide
              that placement.
            </p>
          </div>

          {PLACEMENTS.map((p) => {
            const value = form.slots[p.key]
            const invalid = value && !SLOT_PATTERN.test(value)
            return (
              <div key={p.key}>
                <label className="block text-sm font-medium text-gray-700">{p.label}</label>
                <p className="text-xs text-gray-400 mb-1.5">{p.where}</p>
                <input
                  value={value}
                  onChange={(e) => setSlot(p.key, e.target.value)}
                  className={INPUT}
                  placeholder="1234567890"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className={`text-xs mt-1.5 ${invalid ? 'text-red-500' : 'text-gray-400'}`}>
                  {invalid ? 'Slot ids are digits only.' : p.hint}
                </p>
              </div>
            )
          })}
        </div>

        {/* ads.txt — served automatically from the publisher id above */}
        {adsTxtLine && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-800">ads.txt</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">
              Served automatically at{' '}
              <a
                href="/ads.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#448834] hover:underline"
              >
                /ads.txt
              </a>{' '}
              as soon as the publisher id above is saved — nothing to upload or
              redeploy. Google needs it to verify the account.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 overflow-x-auto whitespace-nowrap">
                {adsTxtLine}
              </code>
              <button
                type="button"
                onClick={copyAdsTxt}
                className="shrink-0 p-2.5 rounded-lg text-gray-400 hover:text-[#448834] hover:bg-green-50 transition-colors"
                title="Copy the ads.txt line"
              >
                {copied ? <Check size={16} className="text-[#448834]" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-[#448834] font-medium">Saved</span>}
          <a
            href="https://www.google.com/adsense/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Open AdSense
            <ExternalLink size={14} />
          </a>
        </div>
      </form>
    </main>
  )
}
