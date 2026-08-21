import { useCallback, useEffect, useState } from 'react'
import { Users, Eye, MousePointer, Clock, ExternalLink, RefreshCw, Globe, Monitor, Smartphone, Link2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

import { API } from '../../api/config.js'
import AdminStatCard from '../../components/AdminStatCard'
import AdminTabs from '../../components/AdminTabs'
const UMAMI_URL = import.meta.env.VITE_UMAMI_URL || 'http://localhost:3002'


function startOfDay(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const RANGES = [
  { label: 'Today', startAt: () => startOfDay(0), endAt: () => Date.now(), unit: 'hour' },
  { label: '7 Days', startAt: () => startOfDay(6), endAt: () => Date.now(), unit: 'day' },
  { label: '30 Days', startAt: () => startOfDay(29), endAt: () => Date.now(), unit: 'day' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
function MetricList({ title, icon: Icon, items, emptyText }) {
  const max = items[0]?.y || 1
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={13} className="text-gray-300" />
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-center py-6 text-gray-300 text-sm">{emptyText || 'No data'}</p>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 6).map((item) => (
            <div key={item.x} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{item.x || 'Direct'}</span>
              <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-[#448834] rounded-full"
                  style={{ width: `${(item.y / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">{item.y}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Analitik() {
  const [rangeIdx, setRangeIdx] = useState(1)
  const [stats, setStats] = useState(null)
  const [pageviews, setPageviews] = useState(null)
  const [pages, setPages] = useState([])
  const [browsers, setBrowsers] = useState([])
  const [devices, setDevices] = useState([])
  const [os, setOs] = useState([])
  const [referrers, setReferrers] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async (idx = rangeIdx) => {
    setLoading(true)
    setError(null)
    const range = RANGES[idx]
    const startAt = range.startAt()
    const endAt = range.endAt()
    try {
      const fetcher = (url) =>
        fetch(url, { credentials: 'include' }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
      const q = `startAt=${startAt}&endAt=${endAt}`
      const [s, pv, pg, br, dv, oss, ref, ctr] = await Promise.all([
        fetcher(`${API}/api/dash/stats?${q}`),
        fetcher(`${API}/api/dash/pageviews?${q}&unit=${range.unit}`),
        fetcher(`${API}/api/dash/pages?${q}`),
        fetcher(`${API}/api/dash/metrics?${q}&type=browser`),
        fetcher(`${API}/api/dash/metrics?${q}&type=device`),
        fetcher(`${API}/api/dash/metrics?${q}&type=os`),
        fetcher(`${API}/api/dash/metrics?${q}&type=referrer`),
        fetcher(`${API}/api/dash/metrics?${q}&type=country`),
      ])
      setStats(s)
      setPageviews(pv)
      setPages(Array.isArray(pg) ? pg : [])
      setBrowsers(Array.isArray(br) ? br : [])
      setDevices(Array.isArray(dv) ? dv : [])
      setOs(Array.isArray(oss) ? oss : [])
      setReferrers(Array.isArray(ref) ? ref : [])
      setCountries(Array.isArray(ctr) ? ctr : [])
    } catch (e) {
      if (e.message.includes('401')) {
        setError('Your session has expired. Please sign in again.')
      } else if (e.message.includes('500')) {
        setError('Could not connect to Umami. Is Docker running? (localhost:3002)')
      } else {
        setError(`Could not load data: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }, [rangeIdx])

  useEffect(() => { load(rangeIdx) }, [rangeIdx, load])

  const chartData = pageviews?.pageviews?.map((pv, i) => ({
    t: pv.x,
    'Page Views': pv.y,
    'Visitors': pageviews?.sessions?.[i]?.y ?? 0,
  })) ?? []

  const maxPages = pages[0]?.y || 1

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analitik</h2>
          <p className="text-sm text-gray-400 mt-1">Site visitor statistics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AdminTabs
            items={RANGES.map((r, i) => ({ id: i, label: r.label }))}
            value={rangeIdx}
            onChange={setRangeIdx}
            size="xs"
          />
          <button
            onClick={() => load(rangeIdx)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <a
            href={UMAMI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ExternalLink size={13} />
            Open in Umami
          </a>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm">{error}</div>
      ) : loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Page Views', value: stats?.pageviews?.value ?? stats?.pageviews ?? 0, icon: Eye },
              { label: 'Unique Visitors', value: stats?.visitors?.value ?? stats?.visitors ?? 0, icon: Users },
              { label: 'Sessions', value: stats?.visits?.value ?? stats?.visits ?? 0, icon: MousePointer },
              { label: 'Avg. Time', value: (() => { const t = stats?.totaltime?.value ?? stats?.totaltime ?? 0; const v = stats?.visits?.value ?? stats?.visits ?? 1; return t ? `${Math.round(t / 60 / v)}m` : '0m' })(), icon: Clock },
            ].map((s) => (
              <AdminStatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          {/* Ziyaret trendi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 text-sm mb-5">Visit Trend</h3>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#448834" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#448834" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Page Views" stroke="#448834" strokeWidth={1.5} fill="url(#pvGrad)" dot={false} />
                  <Area type="monotone" dataKey="Visitors" stroke="#cbd5e1" strokeWidth={1.5} fill="url(#sesGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sayfalar + Kaynaklar */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Most viewed pages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">Most Viewed Pages</h3>
              {pages.length === 0 ? (
                <p className="text-center py-6 text-gray-300 text-sm">No data</p>
              ) : (
                <div className="space-y-2.5">
                  {pages.slice(0, 8).map((p, i) => (
                    <div key={p.x} className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-4 shrink-0 text-right">{i + 1}</span>
                      <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{p.x}</span>
                      <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#448834] rounded-full"
                          style={{ width: `${(p.y / maxPages) * 100}%`, opacity: 1 - i * 0.07 }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{p.y}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <MetricList title="Traffic Sources" icon={Link2} items={referrers} emptyText="No source data" />
          </div>

          {/* Device / Browser / OS / Country */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricList title="Cihazlar" icon={Smartphone} items={devices} />
            <MetricList title="Browsers" icon={Monitor} items={browsers} />
            <MetricList title="Operating System" icon={Monitor} items={os} />
            <MetricList title="Countries" icon={Globe} items={countries} />
          </div>

        </div>
      )}
    </main>
  )
}
