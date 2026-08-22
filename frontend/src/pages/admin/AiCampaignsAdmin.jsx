import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Play, Pause, Sparkles, AlertTriangle, ScrollText } from 'lucide-react'
import {
  deleteAiCampaign,
  fetchAiCampaigns,
  fetchAiStatus,
  setAiCampaignState,
} from '../../api/aiContent'
import { evaluateSchedule, formatDuration } from '../../lib/aiCampaign'
import { formatDateTime } from '../../lib/date'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

function StatusPill({ campaign }) {
  if (campaign.running > 0) {
    return <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Generating</span>
  }
  if (campaign.status === 'active' && campaign.enabled) {
    return <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
  }
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Paused</span>
}

export default function AiCampaignsAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // The auth context hands out a fresh `logout` on every render, so these stay
  // plain functions and the effect below runs once — never in a refetch loop.
  const handleAuthError = (err) => {
    if (err.status === 401) {
      logout()
      navigate('/rnl-panel/login')
      return true
    }
    return false
  }

  const load = () => {
    setLoading(true)
    Promise.all([fetchAiCampaigns(), fetchAiStatus()])
      .then(([list, state]) => {
        setCampaigns(list)
        setStatus(state)
        setError('')
      })
      .catch((err) => {
        if (!handleAuthError(err)) setError(err.message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(campaign) {
    setBusyId(campaign.id)
    try {
      const action = campaign.enabled ? 'pause' : 'resume'
      const updated = await setAiCampaignState(campaign.id, action)
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, ...updated } : c)))
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(campaign) {
    if (!confirm(`Delete the "${campaign.name}" campaign? Its generation history goes with it.`)) return
    setBusyId(campaign.id)
    try {
      await deleteAiCampaign(campaign.id)
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id))
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Campaigns</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {campaigns.length} campaign{campaigns.length === 1 ? '' : 's'} · every article is created as a draft
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/rnl-panel/ai-loglar"
            className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <ScrollText size={16} />
            Generation logs
          </Link>
          <Link
            to="/rnl-panel/ai-kampanyalar/yeni"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            New Campaign
          </Link>
        </div>
      </div>

      {status?.unavailableReason && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Generation is not running: {status.unavailableReason}. Campaigns can still be created and edited.
          </span>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Sparkles size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="mb-4">No campaigns yet.</p>
          <Link to="/rnl-panel/ai-kampanyalar/yeni" className="text-[#448834] font-semibold hover:underline">
            Create the first campaign
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-4 font-medium">Campaign</th>
                  <th className="text-left px-5 py-4 font-medium">Plan</th>
                  <th className="text-left px-5 py-4 font-medium">Today</th>
                  <th className="text-left px-5 py-4 font-medium">Next run</th>
                  <th className="text-left px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((campaign) => {
                  const plan = evaluateSchedule(campaign)
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          to={`/rnl-panel/ai-kampanyalar/${campaign.id}`}
                          className="font-semibold text-gray-900 text-base leading-snug hover:text-[#448834]"
                        >
                          {campaign.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{campaign.masterPrompt}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        <span className="tabular-nums">{campaign.dailyTarget}</span>/day ·{' '}
                        <span className="tabular-nums">{campaign.intervalMinutes}</span> min
                        <p className="text-xs text-gray-300 mt-0.5">
                          {String(campaign.generationStartHour).padStart(2, '0')}:00–
                          {String(campaign.generationEndHour).padStart(2, '0')}:00 {campaign.timezone}
                        </p>
                        {!plan.fits && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            Needs {formatDuration(plan.requiredMinutes)} of window
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 tabular-nums">
                        {campaign.generatedToday}/{campaign.dailyTarget}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {campaign.nextGenerationAt ? formatDateTime(campaign.nextGenerationAt) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill campaign={campaign} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => toggle(campaign)}
                            disabled={busyId === campaign.id}
                            title={campaign.enabled ? 'Pause' : 'Resume'}
                            aria-label={campaign.enabled ? `Pause ${campaign.name}` : `Resume ${campaign.name}`}
                            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {campaign.enabled ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <Link
                            to={`/rnl-panel/ai-kampanyalar/${campaign.id}/duzenle`}
                            aria-label={`Edit ${campaign.name}`}
                            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => remove(campaign)}
                            disabled={busyId === campaign.id}
                            aria-label={`Delete ${campaign.name}`}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
