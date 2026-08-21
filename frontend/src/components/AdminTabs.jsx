// Segmented/pill tab group used on admin pages. `size` controls button padding
// and font size; `wrap` lets tabs flow onto a second line on narrow screens.
const SIZE_CLASSES = {
  md: 'px-4 py-1.5 text-sm',
  sm: 'px-3 py-1.5 text-sm',
  xs: 'px-3 py-1.5 text-xs',
}

export default function AdminTabs({ items, value, onChange, size = 'md', wrap = false }) {
  return (
    <div className={`flex bg-gray-100 rounded-xl p-1 gap-0.5 ${wrap ? 'flex-wrap' : ''}`}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`rounded-lg font-semibold transition-all ${SIZE_CLASSES[size]} ${
            value === item.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
