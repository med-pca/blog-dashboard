import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pause,
  Play,
  Pencil,
  Sparkles,
  Zap,
  FileText,
  ScrollText,
  AlertTriangle,
} from 'lucide-react'
import {
  fetchAiCampaign,
  fetchAiCampaignDrafts,
  fetchAiCampaignStats,
  generateAiNext,
  generateAiTestDraft,
  setAiCampaignState,
} from '../../api/aiContent'
import { formatDuration } from '../../lib/aiCampaign'
import { formatDateTime } from '../../lib/date'
import AdminStatCard from '../../components/AdminStatCard'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-gray-700 text-right">{value}</span>
    </div>
  )
}

export default function AiCampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAdminAuth()

  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Kept as plain functions: the auth context returns a new `logout` on every
  // render, so memoising on it would turn the effect below into a refetch loop.
  const handleError = (err) => {
    if (err.status === 401) {
      logout()
      navigate('/rnl-panel/login')
      return
    }
    setError(err.message)
  }

  const load = () => {
    setLoading(true)
    Promise.all([fetchAiCampaign(id), fetchAiCampaignStats(id), fetchAiCampaignDrafts(id)])
      .then(([c, s, d]) => {
        setCampaign(c)
        setStats(s)
        setDrafts(d)
        setError('')
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action) {
    setBusy(action)
    setError('')
    setNotice('')
    try {
      if (action === 'test') {
        await generateAiTestDraft(id)
        setNotice('Test draft queued. It does not count against today’s target; refresh in a minute.')
      } else if (action === 'now') {
        if (!confirm('Generate the next article now? It counts against today’s target.')) return
        await generateAiNext(id)
        setNotice('Generation queued. Refresh in a minute to see the draft.')
      } else {
        const updated = await setAiCampaignState(id, action)
        setCampaign((prev) => ({ ...prev, ...updated }))
      }
    } catch (err) {
      handleError(err)
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return <main className="max-w-5xl mx-auto px-6 py-8"><div className="text-center py-20 text-gray-400">Loading...</div></main>
  }

  if (!campaign) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error || 'Campaign not found'}</div>
      </main>
    )
  }

  const buttonBase =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40'

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/rnl-panel/ai-kampanyalar')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        AI Campaigns
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {campaign.dailyTarget} per day · every {campaign.intervalMinutes} min ·{' '}
            {String(campaign.generationStartHour).padStart(2, '0')}:00–
            {String(campaign.generationEndHour).padStart(2, '0')}:00 {campaign.timezone}
          </p>
        </div>
        <Link
          to={`/rnl-panel/ai-kampanyalar/${id}/duzenle`}
          className={`${buttonBase} border border-gray-200 text-gray-600 hover:bg-gray-50`}
        >
          <Pencil size={15} />
          Edit
        </Link>
      </div>

      {stats?.unavailableReason && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>Generation is not running: {stats.unavailableReason}</span>
        </div>
      )}
      {!stats?.schedule?.fits && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            The window is too short for this plan: it needs {formatDuration(stats?.schedule?.requiredMinutes ?? 0)} but
            offers {formatDuration(stats?.schedule?.availableMinutes ?? 0)}.
          </span>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
      {notice && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">{notice}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button onClick={() => run('test')} disabled={busy !== ''} className={`${buttonBase} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
          <Sparkles size={15} />
          Generate one test draft
        </button>
        <button onClick={() => run('now')} disabled={busy !== ''} className={`${buttonBase} bg-[#448834] text-white hover:bg-[#357228]`}>
          <Zap size={15} />
          Generate next article now
        </button>
        {campaign.enabled ? (
          <button onClick={() => run('pause')} disabled={busy !== ''} className={`${buttonBase} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
            <Pause size={15} />
            Pause
          </button>
        ) : (
          <button onClick={() => run('resume')} disabled={busy !== ''} className={`${buttonBase} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
            <Play size={15} />
            Resume
          </button>
        )}
        <Link to="/rnl-panel/blog" className={`${buttonBase} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
          <FileText size={15} />
          View drafts
        </Link>
        <Link to={`/rnl-panel/ai-loglar?campaignId=${id}`} className={`${buttonBase} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
          <ScrollText size={15} />
          View logs
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard label="Target today" value={stats?.dailyTarget ?? 0} icon={Zap} />
        <AdminStatCard label="Done today" value={stats?.generatedToday ?? 0} icon={Sparkles} />
        <AdminStatCard label="Remaining today" value={stats?.remainingToday ?? 0} icon={FileText} />
        <AdminStatCard label="Failed (24h)" value={stats?.failed24h ?? 0} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Run state</h2>
          <Row label="Status" value={campaign.enabled ? 'Active' : 'Paused'} />
          <Row label="Queued" value={stats?.queued ?? 0} />
          <Row label="Running" value={stats?.running ?? 0} />
          <Row label="Next generation" value={stats?.nextGenerationAt ? formatDateTime(stats.nextGenerationAt) : '—'} />
          <Row label="Last generation" value={stats?.lastGenerationAt ? formatDateTime(stats.lastGenerationAt) : '—'} />
          <Row label="Total drafts" value={stats?.totalDrafts ?? 0} />
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Consumption</h2>
          <Row label="Input tokens" value={(stats?.inputTokens ?? 0).toLocaleString('en-US')} />
          <Row label="Output tokens" value={(stats?.outputTokens ?? 0).toLocaleString('en-US')} />
          <Row label="Estimated cost" value={`$${(stats?.estimatedCost ?? 0).toFixed(4)}`} />
          <Row label="Minimum run time" value={formatDuration(stats?.schedule?.requiredMinutes ?? 0)} />
          <Row label="Window length" value={formatDuration(stats?.schedule?.availableMinutes ?? 0)} />
          <Row label="Last start" value={`${stats?.schedule?.lastStartLabel ?? '—'} local`} />
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 mt-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Generated drafts</h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No drafts from this campaign yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {drafts.map((draft) => (
              <li key={draft.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/rnl-panel/blog/${draft.id}/duzenle`}
                    className="text-sm font-medium text-gray-800 hover:text-[#448834] truncate block"
                  >
                    {draft.title}
                  </Link>
                  <p className="text-xs text-gray-300 mt-0.5">/recipes/{draft.slug}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    draft.published ? 'text-green-600 bg-green-50' : 'text-violet-600 bg-violet-50'
                  }`}
                >
                  {draft.published ? 'Published' : 'AI Draft'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
