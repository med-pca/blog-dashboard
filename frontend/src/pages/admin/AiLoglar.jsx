import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ScrollText, RefreshCw, FileText } from 'lucide-react'
import { fetchAiCampaigns, fetchAiJobs, retryAiJob } from '../../api/aiContent'
import { dayRangeToIso, formatDateTime } from '../../lib/date'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import AdminPager from '../../components/AdminPager'
import AdminDateRange from '../../components/AdminDateRange'
import AdminTabs from '../../components/AdminTabs'

const STATUS_STYLES = {
  queued: 'text-gray-600 bg-gray-100',
  running: 'text-blue-600 bg-blue-50',
  succeeded: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50',
  cancelled: 'text-amber-600 bg-amber-50',
}

function duration(job) {
  if (!job.startedAt || !job.completedAt) return '—'
  const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  return ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

function JobRow({ job, onRetry, retrying }) {
  const canRetry = job.status === 'failed' || job.status === 'cancelled'
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[job.status] ?? STATUS_STYLES.queued}`}>
          {job.status}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-800 truncate">{job.topic || <span className="text-gray-300">No topic yet</span>}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {job.campaign?.name ?? job.campaignId} · {job.triggerType} · attempt {job.attempt}/{job.maxAttempts} ·{' '}
            {job.model}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.blogPostId && (
            <Link
              to={`/rnl-panel/blog/${job.blogPostId}/duzenle`}
              title="Open the generated draft"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#448834] hover:bg-green-50 transition-colors"
            >
              <FileText size={14} />
            </Link>
          )}
          {canRetry && (
            <button
              onClick={() => onRetry(job.id)}
              disabled={retrying === job.id}
              title="Retry this generation"
              aria-label={`Retry job ${job.id}`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#448834] hover:bg-green-50 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
        <span>Planned: {formatDateTime(job.plannedFor)}</span>
        <span>Started: {job.startedAt ? formatDateTime(job.startedAt) : '—'}</span>
        <span>Finished: {job.completedAt ? formatDateTime(job.completedAt) : '—'}</span>
        <span>Duration: {duration(job)}</span>
        <span className="tabular-nums">Tokens: {(job.inputTokens ?? 0)} in / {(job.outputTokens ?? 0)} out</span>
        <span className="tabular-nums">Cost: ${(job.estimatedCost ?? 0).toFixed(4)}</span>
      </div>

      {job.errorMessage && (
        <p className="mt-2 text-xs text-red-600 whitespace-pre-wrap break-words">
          <span className="font-mono">[{job.errorCode}]</span> {job.errorMessage}
        </p>
      )}
    </div>
  )
}

export default function AiLoglar() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [data, setData] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(null)

  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') ?? '')
  const [status, setStatus] = useState('all')
  const [trigger, setTrigger] = useState('all')
  const [page, setPage] = useState(1)
  const [fromDay, setFromDay] = useState('')
  const [toDay, setToDay] = useState('')

  // Plain functions on purpose: the auth context hands out a fresh `logout`
  // each render, so memoising on it would re-run the effect endlessly.
  const handleError = (err) => {
    if (err.status === 401) {
      logout()
      navigate('/rnl-panel/login')
      return
    }
    setError(err.message)
  }

  useEffect(() => {
    fetchAiCampaigns().then(setCampaigns).catch(() => { /* the filter simply stays empty */ })
  }, [])

  const load = () => {
    let ignore = false
    setLoading(true)
    fetchAiJobs({
      campaignId: campaignId || undefined,
      status: status === 'all' ? undefined : status,
      triggerType: trigger === 'all' ? undefined : trigger,
      page,
      ...dayRangeToIso(fromDay, toDay),
    })
      .then((result) => { if (!ignore) { setData(result); setError('') } })
      .catch((err) => { if (!ignore) handleError(err) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }

  // Stale responses from a superseded filter are discarded by `ignore`.
  useEffect(() => load(), [campaignId, status, trigger, page, fromDay, toDay]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onRetry(jobId) {
    setRetrying(jobId)
    try {
      await retryAiJob(jobId)
      load()
    } catch (err) {
      handleError(err)
    } finally {
      setRetrying(null)
    }
  }

  const jobs = data?.jobs ?? []

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Generation Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data?.total ?? 0} runs · 25 per page · one row per generation attempt
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminDateRange
            from={fromDay}
            to={toDay}
            onChange={(nextFrom, nextTo) => { setFromDay(nextFrom); setToDay(nextTo); setPage(1) }}
          />
          <select
            value={campaignId}
            onChange={(e) => { setCampaignId(e.target.value); setPage(1) }}
            aria-label="Campaign filter"
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#448834]/30"
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <AdminTabs
          size="xs"
          wrap
          items={[
            { id: 'all', label: 'All' },
            { id: 'queued', label: 'Queued' },
            { id: 'running', label: 'Running' },
            { id: 'succeeded', label: 'Succeeded' },
            { id: 'failed', label: 'Failed' },
          ]}
          value={status}
          onChange={(next) => { setStatus(next); setPage(1) }}
        />
        <AdminTabs
          size="xs"
          wrap
          items={[
            { id: 'all', label: 'Any trigger' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'manual', label: 'Manual' },
            { id: 'retry', label: 'Retry' },
            { id: 'test', label: 'Test' },
          ]}
          value={trigger}
          onChange={(next) => { setTrigger(next); setPage(1) }}
        />
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

      {loading && !data ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ScrollText size={36} className="mx-auto mb-3 text-gray-300" />
          <p>No generation runs match the filter.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onRetry={onRetry} retrying={retrying} />
            ))}
          </div>
          <AdminPager
            page={data?.page ?? 1}
            pageCount={data?.pageCount ?? 1}
            onChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </main>
  )
}
