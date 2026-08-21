import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, FolderOpen, Star, Plus } from 'lucide-react'
import { fetchAllProjects, fetchAllReferences, fetchLogs } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [projects, setProjects] = useState([])
  const [refs, setRefs] = useState([])
  const [logStats, setLogStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllProjects(), fetchAllReferences(), fetchLogs().catch(() => null)])
      .then(([p, r, l]) => { setProjects(p); setRefs(r); setLogStats(l?.stats ?? null) })
      .catch((err) => {
        if (err.status === 401) {
          logout()
          navigate('/rnl-panel/login')
        }
      })
      .finally(() => setLoading(false))
  }, [logout, navigate])

  const publishedProjects = projects.filter((p) => p.published)
  const publishedRefs = refs.filter((r) => r.published)
  const totalKw = projects.reduce((s, p) => s + parseFloat(p.kw || 0), 0)
  const totalKwStr = totalKw % 1 === 0 ? totalKw : totalKw.toFixed(1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      <img
        src="/food/logo-mark.svg"
        alt=""
        className="hidden sm:block fixed bottom-0 right-0 w-80 lg:w-md opacity-5 pointer-events-none select-none"
      />

      {/* Hero banner — full width */}
      <div className="relative overflow-hidden w-full flex items-center justify-center py-6 sm:py-8"
        style={{ backgroundImage: 'url(/adminbanner.webp)', backgroundSize: 'cover', backgroundPosition: 'center 85%' }}>
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center">
          <p className="text-white/70 text-sm sm:text-lg mb-2 drop-shadow-md tracking-widest uppercase">Admin Panel</p>
          <h1 className="text-white text-4xl sm:text-6xl font-bold drop-shadow-lg">Welcome back</h1>
          <p className="text-white/60 text-base sm:text-xl mt-3 drop-shadow-md">Flavor Journal</p>
        </div>
      </div>

    <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {/* Stats card */}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
          <FolderOpen size={14} className="text-[#448834]" />
          Overview
        </p>
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden flex flex-col sm:flex-row">
        <img src="/statsbanner.webp" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[25%] w-full h-auto opacity-10 pointer-events-none" />
        <div className="relative flex-1 px-6 sm:px-7 py-5 sm:py-6 overflow-hidden border-b sm:border-b-0 sm:border-r border-gray-100">
          <div className="relative z-10">
            <p className="text-5xl font-bold text-[#448834] font-['Rajdhani'] drop-shadow-sm">{projects.length}</p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Total Collections</p>
            {projects.length - publishedProjects.length > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{projects.length - publishedProjects.length} hidden</p>
            )}
          </div>
        </div>

        <div className="relative flex-1 px-6 sm:px-7 py-5 sm:py-6 overflow-hidden border-b sm:border-b-0 sm:border-r border-gray-100">
          <div className="relative z-10">
            <p className="text-5xl font-bold text-[#448834] font-['Rajdhani'] drop-shadow-sm">{refs.length}</p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Total Community Entries</p>
            {refs.length - publishedRefs.length > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{refs.length - publishedRefs.length} hidden</p>
            )}
          </div>
        </div>

        <div className="relative flex-1 px-6 sm:px-7 py-5 sm:py-6 overflow-hidden border-b sm:border-b-0 sm:border-r border-gray-100">
          <div className="relative z-10">
            <p className="text-5xl font-bold text-[#448834] font-['Rajdhani'] drop-shadow-sm">
              {totalKwStr}
            </p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Featured Recipes</p>
          </div>
        </div>

        <Link to="/rnl-panel/loglar" className="relative flex-1 px-6 sm:px-7 py-5 sm:py-6 overflow-hidden hover:bg-gray-50 transition-colors">
          <div className="relative z-10">
            <p className={`text-5xl font-bold font-['Rajdhani'] drop-shadow-sm ${(logStats?.errors24h ?? 0) > 0 ? 'text-red-500' : 'text-[#448834]'}`}>
              {logStats?.errors24h ?? 0}
            </p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Errors (24h)</p>
            {(logStats?.warns24h ?? 0) > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{logStats.warns24h} warnings</p>
            )}
          </div>
        </Link>
      </div>
      </div>


      {/* Quick actions */}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
          <Zap size={14} className="text-[#448834]" />
          Quick Actions
        </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/rnl-panel/projeler/yeni"
          className="group relative bg-white hover:bg-gray-50 rounded-2xl overflow-hidden flex items-center px-6 py-5 min-h-22.5 transition-all duration-200 border border-gray-100 border-l-4 border-l-[#448834] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="/yeni_proje.webp" alt="" className="absolute w-44 h-44 object-contain shrink-0 opacity-10" style={{ right: -30, bottom: -47 }} />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-gray-800 font-bold text-base">New Collection</p>
              <Plus size={16} className="text-gray-800" />
            </div>
            <p className="text-gray-400 text-sm mt-0.5">Add and publish</p>
          </div>
        </Link>

        <Link
          to="/rnl-panel/referanslar/yeni"
          className="group relative bg-white hover:bg-gray-50 rounded-2xl overflow-hidden flex items-center px-6 py-5 min-h-22.5 transition-all duration-200 border border-gray-100 border-l-4 border-l-[#448834] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="/yeni_referans.webp" alt="" className="absolute w-36 h-36 object-contain shrink-0 opacity-10" style={{ right: -25, bottom: -30 }} />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-gray-800 font-bold text-base">New Community Entry</p>
              <Plus size={16} className="text-gray-800" />
            </div>
            <p className="text-gray-400 text-sm mt-0.5">Add a logo</p>
          </div>
        </Link>

        <Link
          to="/rnl-panel/analitik"
          className="group relative bg-white hover:bg-gray-50 rounded-2xl overflow-hidden flex items-center px-6 py-5 min-h-22.5 transition-all duration-200 border border-gray-100 border-l-4 border-l-[#448834] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="/analitik_banner.webp" alt="" className="absolute w-36 h-36 object-contain shrink-0 opacity-10" style={{ right: -25, bottom: -35 }} />
          <div className="relative z-10">
            <p className="text-gray-800 font-bold text-base">Analytics</p>
            <p className="text-gray-400 text-sm mt-0.5">Visitor statistics</p>
          </div>
        </Link>
      </div>
      </div>
    </main>
    </div>
  )
}
