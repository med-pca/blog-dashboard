import { X } from 'lucide-react'

// Start–end day picker for admin lists (Logs, Chat requests).
// Values use the <input type="date"> format (YYYY-MM-DD); ISO conversion is the caller's job.
export default function AdminDateRange({ from, to, onChange }) {
  const inputCls =
    'px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:border-gray-300'

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={e => onChange(e.target.value, to)}
        className={inputCls}
        aria-label="Start date"
      />
      <span className="text-sm text-gray-300">–</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={e => onChange(from, e.target.value)}
        className={inputCls}
        aria-label="End date"
      />
      {(from || to) && (
        <button
          onClick={() => onChange('', '')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Clear date filter"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
