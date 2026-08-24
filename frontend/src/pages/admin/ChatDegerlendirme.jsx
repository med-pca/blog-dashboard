import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronDown, ChevronRight, MessageCircle, Bot, Users, Send, Clock, TrendingUp, Trash2 } from 'lucide-react'
import { fetchChatRatings, fetchChatLeads, fetchChatFunnel, deleteChatLead, deleteChatRating } from '../../api/admin'
import { dayRangeToIso, formatDateTime } from '../../lib/date'
import { applyPagedResult } from '../../lib/adminPaging'
import { useLatestFetch } from '../../hooks/useLatestFetch'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import AdminPager from '../../components/AdminPager'
import AdminDateRange from '../../components/AdminDateRange'
import AdminStatCard from '../../components/AdminStatCard'
import AdminTabs from '../../components/AdminTabs'

function Stars({ value, size = 15 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= value ? 'text-amber-400' : 'text-gray-200'}
          fill={star <= value ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

function Transcript({ conversation }) {
  return (
    <div className="px-5 pb-4 pt-1 border-t border-gray-50 space-y-2">
      {conversation.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] px-3.5 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-[#448834] text-white rounded-br-sm'
                : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm'
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  )
}

function RatingRow({ rating, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const hasConversation = rating.conversation?.length > 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="w-full flex items-center gap-2 pr-3">
        <button
          onClick={() => hasConversation && setExpanded(e => !e)}
          className={`flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-5 py-4 text-left ${hasConversation ? '' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <Stars value={rating.rating} />
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <MessageCircle size={14} className="text-gray-300" />
              {rating.messageCount} mesaj
            </span>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-gray-400">{formatDateTime(rating.createdAt)}</span>
            {hasConversation && (
              <ChevronDown
                size={16}
                className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            )}
          </div>
        </button>
        <button
          onClick={() => onDelete(rating.id)}
          disabled={deleting}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
          aria-label="Delete rating"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && <Transcript conversation={rating.conversation} />}
    </div>
  )
}

// What actually came out of the conversation. 'contact_requested' is reserved
// for a contact-form event the chatbot does not emit yet; it is rendered anyway
// so a lead never shows up without a label.
const LEAD_OUTCOMES = {
  active: { label: 'no answer reached', icon: Clock, className: 'text-amber-600' },
  assisted: { label: 'assisted by the chatbot', icon: Bot, className: 'text-green-600' },
  contact_requested: { label: 'went to the contact form', icon: Send, className: 'text-blue-600' },
}

function LeadRow({ lead, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const hasConversation = lead.conversation?.length > 0
  const outcome = LEAD_OUTCOMES[lead.status] ?? LEAD_OUTCOMES.active

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="w-full flex items-center gap-2 pr-3">
        <button
          onClick={() => hasConversation && setExpanded(e => !e)}
          className={`flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-5 py-4 text-left ${hasConversation ? '' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`flex items-center gap-1.5 text-sm font-medium shrink-0 ${outcome.className}`}>
              <outcome.icon size={13} /> {outcome.label}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <MessageCircle size={14} className="text-gray-300" />
              {lead.messageCount} mesaj
            </span>
            {lead.rating != null && <Stars value={lead.rating} size={13} />}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-gray-400">{formatDateTime(lead.updatedAt)}</span>
            {hasConversation && (
              <ChevronDown
                size={16}
                className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            )}
          </div>
        </button>
        <button
          onClick={() => onDelete(lead.id)}
          disabled={deleting}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
          aria-label="Delete request"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && <Transcript conversation={lead.conversation} />}
    </div>
  )
}

function percent(part, whole) {
  if (!whole) return '—'
  return `%${Math.round((part / whole) * 100)}`
}

function FunnelSection() {
  const [days, setDays] = useState(30)
  const [funnel, setFunnel] = useState(null)

  useEffect(() => {
    let ignore = false
    fetchChatFunnel(days).then(data => { if (!ignore) setFunnel(data) }).catch(() => {})
    return () => { ignore = true }
  }, [days])

  const steps = [
    { label: 'Chat Opens', value: funnel?.opened ?? 0, rate: null },
    { label: 'Wrote a message', value: funnel?.messaged ?? 0, rate: percent(funnel?.messaged, funnel?.opened) },
    { label: 'Assisted conversations', value: funnel?.assisted ?? 0, rate: percent(funnel?.assisted, funnel?.messaged) },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-gray-300" />
          <h3 className="font-semibold text-gray-700 text-sm">Conversion Funnel</h3>
        </div>
        <AdminTabs
          items={[{ id: 7, label: '7 Days' }, { id: 30, label: '30 Days' }]}
          value={days}
          onChange={setDays}
          size="xs"
        />
      </div>
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            {i > 0 && <ChevronRight size={18} className="text-gray-300 shrink-0 mx-1" />}
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold font-['Rajdhani'] text-gray-900">{step.value}</p>
              <p className="text-xs text-gray-500">{step.label}</p>
              {step.rate !== null && <p className="text-[11px] text-gray-400 mt-0.5">conversion {step.rate}</p>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-300 mt-4">
        The open counter has been collecting since the feature went live.
      </p>
    </div>
  )
}

function LeadsTab({ leadData, onDeleteLead, deletingId, onPageChange, status, fromDay, toDay, onStatusChange, onDatesChange }) {
  const stats = leadData?.stats ?? { total: 0, active: 0, assisted: 0, contactRequested: 0 }
  const leads = leadData?.leads ?? []

  if (stats.total === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users size={36} className="mx-auto mb-3 text-gray-300" />
        <p>No potential leads yet.</p>
        <p className="text-xs mt-1">Appears here once a visitor writes 2+ messages in the chatbot.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <AdminStatCard label="Total Requests" value={stats.total} icon={Users} />
        <AdminStatCard label="Assisted conversations" value={stats.assisted} icon={Bot} />
        <AdminStatCard label="No answer reached" value={stats.active} icon={Clock} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <AdminTabs
          items={[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'No answer reached' },
            { id: 'assisted', label: 'Assisted' },
          ]}
          value={status}
          onChange={onStatusChange}
        />
        <AdminDateRange from={fromDay} to={toDay} onChange={onDatesChange} />
      </div>
      {leads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No requests match the filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(l => (
            <LeadRow key={l.id} lead={l} onDelete={onDeleteLead} deleting={deletingId === l.id} />
          ))}
        </div>
      )}
      <AdminPager page={leadData?.page ?? 1} pageCount={leadData?.pageCount ?? 1} onChange={onPageChange} />
    </>
  )
}

function RatingsTab({ ratingData, onDeleteRating, deletingId, onPageChange }) {
  const stats = ratingData?.stats ?? { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  const ratings = ratingData?.ratings ?? []
  const maxCount = Math.max(1, ...Object.values(stats.counts))

  if (stats.total === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Bot size={36} className="mx-auto mb-3 text-gray-300" />
        <p>No ratings yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-4xl font-bold text-gray-900 font-['Rajdhani']">{stats.average.toFixed(1).replace('.', ',')}</p>
          <Stars value={Math.round(stats.average)} size={18} />
          <p className="text-xs text-gray-400 uppercase tracking-widest">ortalama puan</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
              <Star size={12} className="text-amber-400 shrink-0" fill="currentColor" />
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#448834] rounded-full"
                  style={{ width: `${(stats.counts[star] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8">{stats.counts[star]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {ratings.map(r => (
          <RatingRow key={r.id} rating={r} onDelete={onDeleteRating} deleting={deletingId === r.id} />
        ))}
      </div>
      <AdminPager page={ratingData?.page ?? 1} pageCount={ratingData?.pageCount ?? 1} onChange={onPageChange} />
    </>
  )
}

export default function ChatDegerlendirme() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [leadData, setLeadData] = useState(null)
  const [ratingData, setRatingData] = useState(null)
  // Both header counters and the tab empty-state need correct data, so the
  // first load waits until both fetches have completed.
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [ratingsLoading, setRatingsLoading] = useState(true)
  const loading = leadsLoading || ratingsLoading
  const [tab, setTab] = useState('leads') // 'leads' | 'ratings'
  const [deletingId, setDeletingId] = useState(null)
  const [leadPage, setLeadPage] = useState(1)
  const [leadStatus, setLeadStatus] = useState('all') // 'all' | 'active' | 'assisted'
  const [leadFromDay, setLeadFromDay] = useState('') // YYYY-MM-DD, empty = no filter
  const [leadToDay, setLeadToDay] = useState('')
  const [ratingPage, setRatingPage] = useState(1)
  // To refetch the list after a delete: bumping the counter re-triggers the
  // effect, and the effect always reads the CURRENT leadStatus/leadPage.
  // (Preferred over firing a fetch inside the delete handler: a fetch there
  // could dispatch with a STALE filter value from the closure after
  // `await deleteChatLead`, overwriting fresher data from an interleaved
  // filter change.)
  const [leadRefreshTick, setLeadRefreshTick] = useState(0)
  const [ratingRefreshTick, setRatingRefreshTick] = useState(0)
  const leadFetch = useLatestFetch()
  const ratingFetch = useLatestFetch()

  function handleFetchError(err) {
    if (err.status === 401) {
      logout()
      navigate('/rnl-panel/login')
    }
  }

  function leadQuery() {
    return {
      page: leadPage,
      status: leadStatus === 'all' ? undefined : leadStatus,
      ...dayRangeToIso(leadFromDay, leadToDay),
    }
  }

  useEffect(() => {
    const seq = leadFetch.next()
    fetchChatLeads(leadQuery())
      .then(result => {
        if (!leadFetch.isCurrent(seq)) return
        // If the page is now out of range (after a delete or a narrowed
        // filter) fall back to the last valid page — otherwise the pager
        // hides itself and the admin gets stranded.
        applyPagedResult(result.leads, result, setLeadPage, setLeadData)
      })
      .catch(err => { if (leadFetch.isCurrent(seq)) handleFetchError(err) })
      .finally(() => {
        if (!leadFetch.isCurrent(seq)) return
        setLeadsLoading(false)
        setDeletingId(null) // if refreshTick came from a delete, the button re-enables only on fresh data
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadPage, leadStatus, leadFromDay, leadToDay, leadRefreshTick])

  function changeLeadStatus(next) {
    setLeadStatus(next)
    setLeadPage(1) // back to page one when the filter changes
  }

  function changeLeadDates(nextFrom, nextTo) {
    setLeadFromDay(nextFrom)
    setLeadToDay(nextTo)
    setLeadPage(1)
  }

  useEffect(() => {
    const seq = ratingFetch.next()
    fetchChatRatings(ratingPage)
      .then(result => {
        if (!ratingFetch.isCurrent(seq)) return
        applyPagedResult(result.ratings, result, setRatingPage, setRatingData)
      })
      .catch(err => { if (ratingFetch.isCurrent(seq)) handleFetchError(err) })
      .finally(() => {
        if (!ratingFetch.isCurrent(seq)) return
        setRatingsLoading(false)
        setDeletingId(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingPage, ratingRefreshTick])

  async function handleDeleteLead(id) {
    if (!confirm('Delete this request?')) return
    setDeletingId(id)
    try {
      await deleteChatLead(id)
      setLeadRefreshTick(t => t + 1) // deletingId, tetiklenen refetch effect'te temizlenir
    } catch (err) {
      alert('Silinemedi: ' + err.message)
      setDeletingId(null)
    }
  }

  async function handleDeleteRating(id) {
    if (!confirm('Delete this rating?')) return
    setDeletingId(id)
    try {
      await deleteChatRating(id)
      setRatingRefreshTick(t => t + 1) // deletingId, tetiklenen refetch effect'te temizlenir
    } catch (err) {
      alert('Silinemedi: ' + err.message)
      setDeletingId(null)
    }
  }

  if (loading) {
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
          <h1 className="text-xl font-bold text-gray-900">Chatbot</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {leadData?.stats?.total ?? 0} leads · {ratingData?.stats?.total ?? 0} ratings
          </p>
        </div>
        <AdminTabs
          items={[
            { id: 'leads', label: 'Potansiyel Talepler' },
            { id: 'ratings', label: 'Ratings' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <FunnelSection />

      {tab === 'leads' ? (
        <LeadsTab
          leadData={leadData}
          onDeleteLead={handleDeleteLead}
          deletingId={deletingId}
          onPageChange={setLeadPage}
          status={leadStatus}
          fromDay={leadFromDay}
          toDay={leadToDay}
          onStatusChange={changeLeadStatus}
          onDatesChange={changeLeadDates}
        />
      ) : (
        <RatingsTab
          ratingData={ratingData}
          onDeleteRating={handleDeleteRating}
          deletingId={deletingId}
          onPageChange={setRatingPage}
        />
      )}
    </main>
  )
}
