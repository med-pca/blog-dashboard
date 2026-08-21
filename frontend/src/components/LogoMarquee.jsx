import { useEffect, useState } from 'react'
import { fetchReferences } from '../api/references'
import { API } from '../api/config.js'

export default function LogoMarquee() {
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReferences().then(setRefs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="pt-10 pb-28 bg-white" style={{ minHeight: 328 }} />
  if (refs.length === 0) return null

  const count = Math.ceil(12 / refs.length)
  const items = Array.from({ length: count }, () => refs).flat()
  const doubled = [...items, ...items]

  return (
    <section className="pt-10 pb-28 bg-white overflow-hidden">
      <div className="text-center mb-16">
        <p className="text-[#357228] font-semibold text-xs uppercase tracking-widest mb-3">Flavor Journal</p>
        <h2 className="text-4xl font-bold text-gray-900">Kitchens That Cook With Us</h2>
      </div>

      <div
        className="flex items-center gap-16 will-change-transform"
        style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}
      >
        {doubled.map((r, i) => (
          <div key={i} className="shrink-0 flex items-center justify-center" style={{ minWidth: 120, height: 112 }}>
            {r.logo?.trim() ? (
              <img
                src={`${API}${r.logo.trim()}`}
                alt={r.name}
                width={200}
                height={112}
                className="h-28 w-auto max-w-50 object-contain grayscale hover:grayscale-0 opacity-75 hover:opacity-100 transition-all duration-300"
                loading="lazy"
              />
            ) : (
              <span className="text-gray-400 font-semibold text-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#448834] inline-block shrink-0" />
                {r.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
