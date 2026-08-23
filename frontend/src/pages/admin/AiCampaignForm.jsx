import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react'
import {
  createAiCampaign,
  fetchAiCampaign,
  fetchAiStatus,
  updateAiCampaign,
} from '../../api/aiContent'
import {
  COMMON_TIMEZONES,
  evaluateSchedule,
  formatDuration,
  localTimezone,
  scheduleWarning,
} from '../../lib/aiCampaign'
import { fetchProjects } from '../../api/projects'

const HOURS = Array.from({ length: 25 }, (_, i) => i)

const EMPTY = {
  name: '',
  collectionId: '',
  masterPrompt: '',
  language: 'English',
  tone: 'friendly and practical',
  targetWords: 1200,
  keywords: '',
  dailyTarget: 2,
  intervalMinutes: 20,
  generationStartHour: 8,
  generationEndHour: 22,
  timezone: localTimezone(),
  enabled: false,
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    collectionId: form.collectionId,
    masterPrompt: form.masterPrompt.trim(),
    language: form.language.trim(),
    tone: form.tone.trim(),
    targetWords: Number(form.targetWords),
    keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    dailyTarget: Number(form.dailyTarget),
    intervalMinutes: Number(form.intervalMinutes),
    generationStartHour: Number(form.generationStartHour),
    generationEndHour: Number(form.generationEndHour),
    timezone: form.timezone,
    enabled: form.enabled,
  }
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]'

export default function AiCampaignForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [maxDaily, setMaxDaily] = useState(100)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [collections, setCollections] = useState([])

  useEffect(() => {
    let ignore = false
    fetchAiStatus()
      .then((status) => { if (!ignore) setMaxDaily(status.dailyMaxPerCampaign) })
      .catch(() => { /* the backend re-checks the cap on save */ })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    let ignore = false
    fetchProjects()
      .then((items) => { if (!ignore) setCollections(items) })
      .catch(() => { if (!ignore) setError('Could not load published collections.') })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let ignore = false
    fetchAiCampaign(id)
      .then((campaign) => {
        if (ignore) return
        setForm({
          ...EMPTY,
          ...campaign,
          keywords: (campaign.keywords || []).join(', '),
        })
        setLoading(false)
      })
      .catch((err) => {
        if (ignore) return
        setError(err.message)
        setLoading(false)
      })
    return () => { ignore = true }
  }, [id, isEdit])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const plan = useMemo(() => evaluateSchedule(form), [form])
  const warning = useMemo(() => scheduleWarning(form), [form])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const payload = toPayload(form)
    if (!payload.name) { setError('Name is required.'); return }
    if (!payload.collectionId) { setError('A collection is required.'); return }
    if (payload.masterPrompt.length < 20) {
      setError('The main instruction must describe the brief in at least 20 characters.')
      return
    }
    if (payload.dailyTarget < 1 || payload.dailyTarget > maxDaily) {
      setError(`Articles per day must be between 1 and ${maxDaily}.`)
      return
    }
    if (payload.intervalMinutes < 5) { setError('The interval must be at least 5 minutes.'); return }
    if (payload.generationStartHour >= payload.generationEndHour) {
      setError('The start hour must be earlier than the end hour.')
      return
    }

    setSaving(true)
    try {
      const saved = isEdit ? await updateAiCampaign(id, payload) : await createAiCampaign(payload)
      navigate(`/rnl-panel/ai-kampanyalar/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/rnl-panel/ai-kampanyalar')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        AI Campaigns
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Campaign' : 'New AI Campaign'}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="ai-name" className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
          <input
            id="ai-name"
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Weeknight family dinners"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="ai-collection" className="block text-sm font-medium text-gray-700 mb-1.5">
            Collection *
          </label>
          <select
            id="ai-collection"
            value={form.collectionId}
            onChange={(e) => set('collectionId', e.target.value)}
            className={inputClass}
          >
            <option value="">Select a published collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}{collection.category ? ` — ${collection.category}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Every generated draft will be assigned to this collection and must match its subject.
          </p>
        </div>

        <div>
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-1.5">
            Main instruction *
          </label>
          <textarea
            id="ai-prompt"
            value={form.masterPrompt}
            onChange={(e) => set('masterPrompt', e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder={
              'Write simple, budget-friendly family recipes in English.\n' +
              'Use ingredients that are easy to find in the United States.\n' +
              'Produce original, detailed recipes.\n' +
              'Avoid recipes that already exist on the site.\n' +
              'Do not invent statistics, testimonials or quotes.'
            }
            className={`${inputClass} resize-y`}
          />
          <p className="text-xs text-gray-400 mt-1">{form.masterPrompt.length}/4000</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ai-language" className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
            <input id="ai-language" type="text" value={form.language} onChange={(e) => set('language', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="ai-tone" className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
            <input id="ai-tone" type="text" value={form.tone} onChange={(e) => set('tone', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="ai-keywords" className="block text-sm font-medium text-gray-700 mb-1.5">
            Keywords <span className="text-gray-400 font-normal">(comma separated, up to 20)</span>
          </label>
          <input
            id="ai-keywords"
            type="text"
            value={form.keywords}
            onChange={(e) => set('keywords', e.target.value)}
            placeholder="weeknight dinner, budget meals"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="ai-words" className="block text-sm font-medium text-gray-700 mb-1.5">Target length (words)</label>
            <input
              id="ai-words"
              type="number"
              min={500}
              max={3000}
              value={form.targetWords}
              onChange={(e) => set('targetWords', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-daily" className="block text-sm font-medium text-gray-700 mb-1.5">Articles per day</label>
            <input
              id="ai-daily"
              type="number"
              min={1}
              max={maxDaily}
              value={form.dailyTarget}
              onChange={(e) => set('dailyTarget', e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Server cap: {maxDaily}</p>
          </div>
          <div>
            <label htmlFor="ai-interval" className="block text-sm font-medium text-gray-700 mb-1.5">Interval (minutes)</label>
            <input
              id="ai-interval"
              type="number"
              min={5}
              max={1440}
              value={form.intervalMinutes}
              onChange={(e) => set('intervalMinutes', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="ai-start" className="block text-sm font-medium text-gray-700 mb-1.5">Start hour</label>
            <select id="ai-start" value={form.generationStartHour} onChange={(e) => set('generationStartHour', e.target.value)} className={inputClass}>
              {HOURS.slice(0, 24).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-end" className="block text-sm font-medium text-gray-700 mb-1.5">End hour</label>
            <select id="ai-end" value={form.generationEndHour} onChange={(e) => set('generationEndHour', e.target.value)} className={inputClass}>
              {HOURS.slice(1).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-tz" className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <select id="ai-tz" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputClass}>
              {[...new Set([form.timezone, ...COMMON_TIMEZONES])].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live feasibility read-out — the same maths the backend applies. */}
        <div className={`rounded-xl px-4 py-3.5 text-sm ${warning ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-600'}`}>
          <div className="flex items-center gap-2 font-medium">
            {warning ? <AlertTriangle size={16} /> : <Clock size={16} />}
            <span data-testid="plan-summary">
              {form.dailyTarget} articles × {form.intervalMinutes} min needs {formatDuration(plan.requiredMinutes)}
              {' '}· window offers {formatDuration(plan.availableMinutes)}
            </span>
          </div>
          <p className="text-xs mt-1">Last article would start around {plan.lastStartLabel} local time.</p>
          {warning && <p className="text-xs mt-1" data-testid="plan-warning">{warning}</p>}
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5">
          <button
            type="button"
            role="switch"
            aria-checked={form.enabled}
            aria-label="Campaign active"
            onClick={() => set('enabled', !form.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? 'bg-[#448834]' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">{form.enabled ? 'Active' : 'Paused'}</p>
            <p className="text-xs text-gray-400">
              {form.enabled
                ? 'The scheduler will generate drafts inside the window above'
                : 'No generation runs while the campaign is paused'}
            </p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#448834] hover:bg-[#357228] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/rnl-panel/ai-kampanyalar')}
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
