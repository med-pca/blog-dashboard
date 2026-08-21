// Summary count card used across admin lists. `dense` gives a smaller variant
// for pages that fit many cards in one row (e.g. Requests).
export default function AdminStatCard({ label, value, icon, dense = false }) {
  const Icon = icon
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 ${dense ? 'p-4' : 'p-5'}`}>
      <div className={`flex items-center justify-between ${dense ? 'mb-2' : 'mb-3'}`}>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</span>
        <Icon size={dense ? 13 : 14} className="text-gray-300" />
      </div>
      <p className={`${dense ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 font-['Rajdhani']`}>{value}</p>
    </div>
  )
}
