import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollText, AlertCircle, AlertTriangle, ChevronDown, Copy, Check } from 'lucide-react'
import { fetchLogs } from '../../api/admin'
import { dayRangeToIso, formatDateTime } from '../../lib/date'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import AdminPager from '../../components/AdminPager'
import AdminDateRange from '../../components/AdminDateRange'
import AdminStatCard from '../../components/AdminStatCard'
import AdminTabs from '../../components/AdminTabs'

function logToText(log) {
  const level = log.level === 'error' ? 'ERROR' : 'WARNING'
  const context = log.context ? ` [${log.context}]` : ''
  return `${formatDateTime(log.createdAt)} [${level}]${context} ${log.message}`
}

function CopyButton({ getText, title, className = '', children }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // permission denied / old browser — fail silently, the button just does nothing
    }
  }

  return (
    <button onClick={copy} title={title} className={className}>
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      {children && <span>{copied ? 'Copied' : children}</span>}
    </button>
  )
}

function LevelBadge({ level }) {
  return level === 'error' ? (
    <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full shrink-0">ERROR</span>
  ) : (
    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">WARNING</span>
  )
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = log.message.length > 140

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4">
        <button
          onClick={() => isLong && setExpanded(e => !e)}
          className={`flex items-center gap-3 min-w-0 flex-1 text-left ${isLong ? '' : 'cursor-default'}`}
        >
          <LevelBadge level={log.level} />
          {log.context && (
            <span className="text-xs font-mono text-gray-400 shrink-0">[{log.context}]</span>
          )}
          <span className={`text-sm text-gray-700 min-w-0 ${expanded ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
            {log.message}
          </span>
        </button>
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
          <CopyButton
            getText={() => logToText(log)}
            title="Copy this record"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          />
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              title={expanded ? 'Daralt' : 'Expand'}
            >
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Loglar() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('all') // 'all' | 'error' | 'warn'
  const [page, setPage] = useState(1)
  const [fromDay, setFromDay] = useState('') // YYYY-MM-DD, empty = no filter
  const [toDay, setToDay] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    fetchLogs({ level: level === 'all' ? undefined : level, page, ...dayRangeToIso(fromDay, toDay) })
      .then(data => { if (!ignore) setData(data) })
      .catch((err) => {
        if (ignore) return
        if (err.status === 401) {
          logout()
          navigate('/rnl-panel/login')
        }
      })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [level, page, fromDay, toDay]) // eslint-disable-line react-hooks/exhaustive-deps

  function changeLevel(next) {
    setLevel(next)
    setPage(1) // back to page one when the filter changes
  }

  function changeDates(nextFrom, nextTo) {
    setFromDay(nextFrom)
    setToDay(nextTo)
    setPage(1)
  }

  const stats = data?.stats ?? { total: 0, errors24h: 0, warns24h: 0 }
  const logs = data?.logs ?? []

  if (loading && !data) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center py-20 text-gray-400">Loading...</div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loglar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Backend errors and warnings · 50 records per page · kept for 30 days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminDateRange from={fromDay} to={toDay} onChange={changeDates} />
          {logs.length > 0 && (
            <CopyButton
              getText={() => logs.map(logToText).join('\n')}
              title="Copy the records on this page"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Kopyala
            </CopyButton>
          )}
          <AdminTabs
            items={[
              { id: 'all', label: 'All' },
              { id: 'error', label: 'Errors' },
              { id: 'warn', label: 'Warnings' },
            ]}
            value={level}
            onChange={changeLevel}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <AdminStatCard label="Total Records" value={stats.total} icon={ScrollText} />
        <AdminStatCard label="Errors (24h)" value={stats.errors24h} icon={AlertCircle} />
        <AdminStatCard label="Warnings (24h)" value={stats.warns24h} icon={AlertTriangle} />
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ScrollText size={36} className="mx-auto mb-3 text-gray-300" />
          {level !== 'all' || fromDay || toDay ? (
            <p>No records match the filter.</p>
          ) : (
            <>
              <p>No records — everything looks fine.</p>
              <p className="text-xs mt-1">Backend errors and warnings show up here.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map(l => (
              <LogRow key={l.id} log={l} />
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
