import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FolderOpen,
  Star,
  BarChart2,
  ScrollText,
  Bot,
  Shield,
  ExternalLink,
  LogOut,
  BookOpen,
  HelpCircle,
  Inbox,
  Megaphone,
  Menu,
  X,
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { usePageTransitionOverlay } from '../../hooks/usePageTransitionOverlay'
import Logo from '../../components/Logo'
import PageLoader from '../../components/PageLoader'

const NAV = [
  { to: '/rnl-panel', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p === '/rnl-panel' },
  { to: '/rnl-panel/projeler', label: 'Collections', icon: FolderOpen, match: (p) => p.startsWith('/rnl-panel/projeler') },
  { to: '/rnl-panel/referanslar', label: 'Community', icon: Star, match: (p) => p.startsWith('/rnl-panel/referanslar') },
  { to: '/rnl-panel/blog', label: 'Blog', icon: BookOpen, match: (p) => p.startsWith('/rnl-panel/blog') },
  { to: '/rnl-panel/sss', label: 'FAQ', icon: HelpCircle, match: (p) => p.startsWith('/rnl-panel/sss') },
  { to: '/rnl-panel/teklif-talepleri', label: 'Requests', icon: Inbox, match: (p) => p.startsWith('/rnl-panel/teklif-talepleri') },
  { to: '/rnl-panel/degerlendirmeler', label: 'Chatbot', icon: Bot, match: (p) => p.startsWith('/rnl-panel/degerlendirmeler') },
  { to: '/rnl-panel/analitik', label: 'Analytics', icon: BarChart2, match: (p) => p.startsWith('/rnl-panel/analitik') },
  { to: '/rnl-panel/loglar', label: 'Logs', icon: ScrollText, match: (p) => p.startsWith('/rnl-panel/loglar') },
  { to: '/rnl-panel/guvenlik', label: 'Security', icon: Shield, match: (p) => p.startsWith('/rnl-panel/guvenlik') },
  { to: '/rnl-panel/ads', label: 'Ads', icon: Megaphone, match: (p) => p.startsWith('/rnl-panel/ads') },
]

export default function AdminLayout() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const showRouteOverlay = usePageTransitionOverlay(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/rnl-panel/login')
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50">
      <PageLoader label="" fullScreen overlay show={showRouteOverlay} />
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen bg-white border-r border-gray-200">
        <Link to="/rnl-panel" className="flex items-center px-6 py-6 shrink-0">
          <Logo className="h-16 w-auto" />
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {/* eslint-disable-next-line no-unused-vars */}
          {NAV.map(({ to, label, icon: Icon, match }) => {
            const active = match(pathname)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#448834] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-3 space-y-0.5 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
          >
            <ExternalLink size={17} className="shrink-0" />
            <span>View site</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut size={17} className="shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Top bar — mobile & tablet */}
      <header className="lg:hidden bg-white shadow-lg shrink-0 relative z-20">
        <div className="flex items-center h-16 px-4 gap-4">
          <Link to="/rnl-panel" className="shrink-0">
            <Logo className="h-14 w-auto" />
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {/* eslint-disable-next-line no-unused-vars */}
            {NAV.map(({ to, label, icon: Icon, match }) => {
              const active = match(pathname)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-[#448834] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              )
            })}
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
              >
                <ExternalLink size={18} />
                <span>View site</span>
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
